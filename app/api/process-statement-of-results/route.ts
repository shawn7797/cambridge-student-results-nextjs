import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { Pool } from "pg";
import { put, del } from "@vercel/blob";
import { PDFDocument } from "pdf-lib";
import { getDocumentProxy, extractText } from "unpdf";

// Allow up to 300 seconds execution time on Vercel Pro
export const maxDuration = 300;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("upstash-signature");

    // Verify the request is genuinely coming from QStash
    const isValid = await receiver.verify({
      signature: signature || "",
      body: bodyText,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { fileUrl } = JSON.parse(bodyText);

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    console.log("Starting QStash PDF processing workflow for URL:", fileUrl);

    // Step 1: Download bulk PDF and split into page buffers
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch bulk PDF from URL: ${fileUrl}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const srcDoc = await PDFDocument.load(fileBuffer);
    const totalPages = srcDoc.getPageCount();
    const pageBuffers: Buffer[] = [];

    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copiedPage);
      const pdfBytes = await singleDoc.save();
      pageBuffers.push(Buffer.from(pdfBytes));
    }

    // Step 2: Process each page using unpdf
    for (let i = 0; i < totalPages; i++) {
      const singlePageBuffer = pageBuffers[i];
      let candidateId = "";
      let fileYear = new Date().getFullYear().toString();
      let pdfProxy: any = null;

      try {
        // Load page buffer into unpdf proxy
        pdfProxy = await getDocumentProxy(new Uint8Array(singlePageBuffer));
        const result = await extractText(pdfProxy, { mergePages: true });
        const pdfText =
          typeof result.text === "string"
            ? result.text.replace(/\s+/g, " ")
            : "";

        const candMatch = pdfText.match(/A[EΕ]021\s*\/\s*(\d+)/i);
        if (candMatch) {
          candidateId = candMatch[1].trim();
        }

        const yearMatch = pdfText.match(
          /Date Printed:\s*\d{1,2}\s+[A-Za-z]+\s+(\d{4})/i,
        );
        if (yearMatch) {
          fileYear = yearMatch[1];
        }
      } catch (parseErr: any) {
        console.warn(
          `Worker: Failed to parse text for page ${i + 1}:`,
          parseErr.message,
        );
        continue;
      } finally {
        // Crucial memory optimization: destroy proxy after use
        if (pdfProxy && typeof pdfProxy.destroy === "function") {
          await pdfProxy.destroy();
        }
      }

      if (!candidateId) {
        console.warn(
          `Worker: Skipped page ${i + 1} (No candidate ID detected)`,
        );
        continue;
      }

      const fileName = `${candidateId}.pdf`;

      // Upload individual page to statement_results/{year}/{candidateID}.pdf
      const blob = await put(
        `statement_results/${fileYear}/${fileName}`,
        singlePageBuffer,
        {
          access: "public",
          contentType: "application/pdf",
          allowOverwrite: true,
        },
      );

      // Save to Database with Upsert handling
      const dbClient = await pool.connect();
      try {
        await dbClient.query("BEGIN");
        await dbClient.query(
          `INSERT INTO statement_of_result (candidate_id, file_name, file_url) VALUES ($1, $2, $3)`,
          [candidateId, fileName, blob.url],
        );
        await dbClient.query("COMMIT");
      } catch (dbErr) {
        await dbClient.query("ROLLBACK");
        console.error(
          `Worker DB Error for page ${i + 1} (Candidate ${candidateId}):`,
          dbErr,
        );
      } finally {
        dbClient.release();
      }
    }

    // Step 3: Clean up and delete the temporary bulk PDF blob
    try {
      await del(fileUrl);
      console.log("Temporary bulk PDF successfully deleted.");
    } catch (cleanupErr: any) {
      console.warn("Failed to delete temporary bulk PDF:", cleanupErr.message);
    }

    return NextResponse.json(
      { success: true, processedPages: totalPages },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("QStash worker fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

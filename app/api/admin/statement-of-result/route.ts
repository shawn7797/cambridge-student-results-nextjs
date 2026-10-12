import { NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Pool } from "pg";
import { put } from "@vercel/blob";
import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Trigger background processing immediately after sending response
    after(async () => {
      console.log("Starting background Statement of Results processing...");
      try {
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = srcDoc.getPageCount();
        const dbClient = await pool.connect();

        try {
          for (let i = 0; i < totalPages; i++) {
            // Isolate each page processing in a try/catch so one failure never stops the loop
            try {
              let candidateId = "";
              let fileYear = new Date().getFullYear().toString();
              let singlePageBuffer: Buffer;

              const singleDoc = await PDFDocument.create();
              const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
              singleDoc.addPage(copiedPage);
              const pdfBytes = await singleDoc.save();
              singlePageBuffer = Buffer.from(pdfBytes);

              let parser: any = null;
              try {
                parser = new PDFParse({ data: singlePageBuffer });
                const pdfResult = await parser.getText();
                const pdfText = pdfResult.text.replace(/\s+/g, " ");

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
                  `Background: Failed to parse text for page ${i + 1}:`,
                  parseErr.message,
                );
                continue;
              } finally {
                if (parser) {
                  await parser.destroy();
                }
              }

              if (!candidateId) {
                console.warn(
                  `Background: Skipped page ${i + 1} (No candidate ID detected)`,
                );
                continue;
              }

              const fileName = `${candidateId}.pdf`;

              // Upload the individual page buffer (not the whole file)
              const blob = await put(
                `statement_results/${fileYear}/${fileName}`,
                singlePageBuffer,
                {
                  access: "public",
                  contentType: "application/pdf",
                },
              );

              await dbClient.query("BEGIN");
              try {
                await dbClient.query(
                  `INSERT INTO statement_of_result (candidate_id, file_name, file_url) VALUES ($1, $2, $3)`,
                  [candidateId, fileName, blob.url],
                );
                await dbClient.query("COMMIT");
              } catch (dbErr) {
                await dbClient.query("ROLLBACK");
                console.error(
                  `Background DB Error for page ${i + 1} (Candidate ${candidateId}):`,
                  dbErr,
                );
              }
            } catch (pageItemErr) {
              console.error(
                `Background error processing page ${i + 1}:`,
                pageItemErr,
              );
            }
          }
          console.log("Background Statement of Results processing completed.");
        } finally {
          dbClient.release();
        }
      } catch (err) {
        console.error("Background task fatal error:", err);
      }
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Statement of Results uploaded successfully. Processing and splitting pages in the background.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Statement of result upload initiation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

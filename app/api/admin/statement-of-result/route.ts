import { NextResponse } from "next/server";
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
    // 1. Verify Authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse uploaded multi-candidate PDF file
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = srcDoc.getPageCount();

    const results = [];
    const dbClient = await pool.connect();

    try {
      // 3. Iterate through each page (each page represents one candidate)
      for (let i = 0; i < totalPages; i++) {
        let candidateId = "";
        let fileYear = new Date().getFullYear().toString();
        let singlePageBuffer: Buffer;

        // Create a single-page PDF document for the current candidate
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
        singleDoc.addPage(copiedPage);
        const pdfBytes = await singleDoc.save();
        singlePageBuffer = Buffer.from(pdfBytes);

        // Parse text from this specific single-page PDF using pdf-parse v2
        let parser: any = null;
        try {
          parser = new PDFParse({ data: singlePageBuffer });
          const pdfResult = await parser.getText();
          const pdfText = pdfResult.text.replace(/\s+/g, " ");

          // Extract candidate number written after centre number (e.g., AE021 / 0007 or AE021/0007)
          const candMatch = pdfText.match(/A[EΕ]021\s*\/\s*(\d+)/i);
          if (candMatch) {
            candidateId = candMatch[1].trim();
          }

          // Extract year from Date Printed if available (e.g., "Date Printed: 15 August 2025")
          const yearMatch = pdfText.match(
            /Date Printed:\s*\d{1,2}\s+[A-Za-z]+\s+(\d{4})/i,
          );
          if (yearMatch) {
            fileYear = yearMatch[1];
          }
        } catch (parseErr: any) {
          console.warn(
            `Failed to parse text for page ${i + 1}:`,
            parseErr.message,
          );
        } finally {
          if (parser) {
            await parser.destroy();
          }
        }

        if (!candidateId) {
          results.push({
            pageNumber: i + 1,
            status: "Failed",
            reason: "Could not detect candidate number on this page.",
          });
          continue;
        }

        const fileName = `${candidateId}.pdf`;

        // 4. Upload individual page PDF to Vercel Blob under statement_results/{fileYear}/{candidateId}.pdf
        const blob = await put(
          `statement_results/${fileYear}/${fileName}`,
          singlePageBuffer,
          {
            access: "public",
            contentType: "application/pdf",
          },
        );

        // // 5. Store record in statement_of_result table (Candidates table is untouched)
        try {
          await dbClient.query("BEGIN");

          const query = `
            INSERT INTO statement_of_result (candidate_id, file_name, file_url)
            VALUES ($1, $2, $3);
          `;
          await dbClient.query(query, [candidateId, fileName, blob.url]);

          await dbClient.query("COMMIT");

          results.push({
            pageNumber: i + 1,
            candidateId,
            fileName,
            status: "Success",
          });
        } catch (dbError: any) {
          await dbClient.query("ROLLBACK");
          results.push({
            pageNumber: i + 1,
            candidateId,
            status: "Failed",
            reason: dbError.message || "Database insert failed",
          });
        }
      }
    } finally {
      dbClient.release();
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error: any) {
    console.error("Statement of result upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

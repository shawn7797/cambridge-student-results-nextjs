import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Pool } from "pg";
import { put } from "@vercel/blob";
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
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const fileName = file.name;

      try {
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        let candidateId = baseName.trim();

        if (!candidateId) {
          results.push({
            fileName,
            status: "Failed",
            reason:
              "Invalid filename. Expected candidate number (e.g., 0007.pdf)",
          });
          continue;
        }

        let candidateName = `Candidate ${candidateId}`;
        let username = "";
        let password = "";
        let releaseDetails: { date: string; subject: string }[] = [];
        let fileYear = new Date().getFullYear().toString();

        let parser: any = null;
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          parser = new PDFParse({ data: buffer });
          const pdfResult = await parser.getText();
          const pdfText = pdfResult.text.replace(/\s+/g, " ");

          // 1. Extract Candidate Name for response feedback only (does not touch candidates table)
          const nameMatch = pdfText.match(
            /Candidate Name:\s*([^C]+?)(?=\s+Candidate Number|$)/i,
          );
          if (nameMatch) {
            candidateName = nameMatch[1].trim();
          }

          // 2. Extract Candidate Number
          const idMatch = pdfText.match(/Candidate Number:\s*([^\s]+)/i);
          if (idMatch) {
            candidateId = idMatch[1].trim();
          }

          // 3. Extract Username
          const userMatch =
            pdfText.match(/Enter your username:\s*([^\s]+)/i) ||
            pdfText.match(/Username\s*:\s*([^\s]+)/i);
          if (userMatch) {
            username = userMatch[1].trim();
          }

          // 4. Extract Password
          const passMatch =
            pdfText.match(/Enter your password:\s*([^\s]+)/i) ||
            pdfText.match(/Password\s*:\s*([^\s]+)/i);
          if (passMatch) {
            password = passMatch[1].trim();
          }

          // 5. Extract Multiple Release Dates and Subjects
          const releaseRegex =
            /(\d{2}:\d{2}\s*\([^)]+\)\s+on\s+[A-Za-z]+,\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+for\s+([A-Za-z\s&]+?)(?=\s*•|\s+\d{2}:\d{2}|\s+You may|\s+Your school|\s+Please|\s+If you|\s+\d|$)/gi;
          const matches = [...pdfText.matchAll(releaseRegex)];

          for (const match of matches) {
            const dateStr = match[1].trim();
            const subjectStr = match[2].trim();
            if (
              !releaseDetails.some(
                (r) => r.date === dateStr && r.subject === subjectStr,
              )
            ) {
              releaseDetails.push({ date: dateStr, subject: subjectStr });
            }
          }

          // Derive fileYear from the first release date found if available
          if (releaseDetails.length > 0) {
            const yearMatch = releaseDetails[0].date.match(/\b(\d{4})\b/);
            if (yearMatch) {
              fileYear = yearMatch[1];
            }
          }
        } catch (pdfErr: any) {
          console.warn(
            `Could not parse PDF text for ${fileName}:`,
            pdfErr.message,
          );
        } finally {
          if (parser) {
            await parser.destroy();
          }
        }

        if (!password) {
          password = `${candidateId}Pass!`;
        }

        const blob = await put(
          `result_passwords/${fileYear}/${fileName}`,
          file,
          { access: "public" },
        );

        // Database transaction: Insert ONLY into result_password table (Candidates table is untouched)
        const dbClient = await pool.connect();
        try {
          await dbClient.query("BEGIN");

          const resultPasswordQuery = `
            INSERT INTO result_password (candidate_id, username, password, release_date, release_details, file_name, file_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `;
          await dbClient.query(resultPasswordQuery, [
            candidateId,
            username || null,
            password,
            releaseDetails.length > 0 ? releaseDetails[0].date : null,
            JSON.stringify(releaseDetails),
            fileName,
            blob.url,
          ]);

          await dbClient.query("COMMIT");
        } catch (dbError) {
          await dbClient.query("ROLLBACK");
          throw dbError;
        } finally {
          dbClient.release();
        }

        results.push({
          fileName,
          candidateId,
          candidateName,
          username: username || "N/A",
          password,
          releaseDetails,
          status: "Success",
        });
      } catch (fileError: any) {
        results.push({
          fileName,
          status: "Failed",
          reason: fileError.message || "Failed to process file",
        });
      }
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error: any) {
    console.error("Admin result upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

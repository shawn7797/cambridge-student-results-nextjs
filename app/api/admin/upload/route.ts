import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Pool } from "pg";
import { put } from "@vercel/blob";
import { PDFParse } from "pdf-parse";
import "pdf-parse/worker";

// Initialize Neon database connection pool
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

    // 2. Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];
    const client = await clerkClient();

    // 3. Process each PDF
    for (const file of files) {
      const fileName = file.name;

      try {
        // Parse candidate ID and name from filename
        // Example: 0007_RIMESS_ELMONCER.pdf
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        const parts = baseName.split("_");

        if (parts.length < 2) {
          results.push({
            fileName,
            status: "Failed",
            reason: "Invalid filename format. Expected CANDIDATE_ID_NAME.pdf",
          });
          continue;
        }

        const candidateId = parts[0].trim();
        const candidateName = parts.slice(1).join(" ").trim();

        // 4. Extract PDF text and find the creation date
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const parser = new PDFParse({ data: fileBuffer });
        let pdfData;
        try {
          pdfData = await parser.getText();
        } finally {
          await parser.destroy();
        }

        // Expected format: Date created: 06 Feb 2025
        const dateMatch = pdfData.text.match(
          /Date\s+created\s*:\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i,
        );

        if (!dateMatch) {
          results.push({
            fileName,
            candidateId,
            status: "Failed",
            reason:
              'Could not find "Date created" in the expected format (e.g., Date created: 06 Feb 2025)',
          });
          continue;
        }

        // Extract year from the matched date
        const yearMatch = dateMatch[1].match(/\b(\d{4})\b/);

        if (!yearMatch) {
          results.push({
            fileName,
            candidateId,
            status: "Failed",
            reason: "Could not extract year from PDF creation date",
          });
          continue;
        }

        const year = yearMatch[1];

        // 5. Upload to Vercel Blob using the extracted year
        const blob = await put(
          `entry_statements/${year}/${fileName}`,
          fileBuffer,
          {
            access: "public",
            contentType: file.type || "application/pdf",
          },
        );

        // 6. Save/update records in Neon DB using a transaction
        const dbClient = await pool.connect();

        try {
          await dbClient.query("BEGIN");

          const candidateQuery = `
            INSERT INTO candidates (candidate_id, name)
            VALUES ($1, $2)
            ON CONFLICT (candidate_id)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING candidate_id;
          `;

          await dbClient.query(candidateQuery, [candidateId, candidateName]);

          const statementQuery = `
            INSERT INTO statement_of_entry
              (candidate_id, file_name, file_url)
            VALUES ($1, $2, $3);
          `;

          await dbClient.query(statementQuery, [
            candidateId,
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

        // 7. Create Clerk user account
        try {
          const dobMatch = pdfData.text.match(
            /Date\s+of\s+Birth\s*:\s*([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i,
          );
          let fileYear = new Date().getFullYear().toString();
          let dateOfBirth = dobMatch?.[1]?.trim() ?? "";
          let dobFormatted = "123";

          if (dobMatch) {
            dateOfBirth = dobMatch[1].trim(); // e.g., "30 Nov 2009"
          } else {
            // Backup regex in case pdf-parse inserts extra text between label and date
            const fallbackDobMatch = pdfData.text.match(
              /([0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4}))/i,
            );
            if (fallbackDobMatch) {
              const yearInt = parseInt(fallbackDobMatch[2], 10);
              if (yearInt < parseInt(fileYear, 10)) {
                dateOfBirth = fallbackDobMatch[1].trim();
              }
            }
          }

          if (dateOfBirth) {
            const dateParts = dateOfBirth.split(/\s+/);
            if (dateParts.length === 3) {
              const [day, monthStr, year] = dateParts;
              const months: Record<string, string> = {
                jan: "01",
                feb: "02",
                mar: "03",
                apr: "04",
                may: "05",
                jun: "06",
                jul: "07",
                aug: "08",
                sep: "09",
                oct: "10",
                nov: "11",
                dec: "12",
              };
              const monthNum = months[monthStr.toLowerCase()];
              if (monthNum) {
                const paddedDay = day.padStart(2, "0");
                dobFormatted = `${paddedDay}${monthNum}${year}`; // DDMMYYYY format
              }
            }
          }

          await pool.query(
            `UPDATE candidates
              SET date_of_birth = $1
              WHERE candidate_id = $2
            `,
            [dobFormatted, candidateId],
          );

          const clerkUser = await client.users.createUser({
            username: candidateId,
            password: candidateId + dobFormatted,
            firstName: candidateName,
            publicMetadata: {
              role: "candidate",
            },
          });

          await pool.query(
            `UPDATE candidates
              SET clerk_user_id = $1
              WHERE candidate_id = $2
            `,
            [clerkUser.id, candidateId],
          );
        } catch (clerkError: any) {
          console.error("Clerk error status:", clerkError.status);
          console.error(
            "Clerk error details:",
            JSON.stringify(clerkError.errors ?? clerkError, null, 2),
          );

          results.push({
            fileName,
            candidateId,
            status: "Partial Success",
            reason:
              clerkError.errors
                ?.map((e: any) => e.longMessage || e.message)
                .join("; ") ||
              clerkError.message ||
              "Clerk user creation failed",
          });
        }

        results.push({
          fileName,
          candidateId,
          candidateName,
          year,
          blobPath: `entry_statements/${year}/${fileName}`,
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
    console.error("Admin upload error:", error);

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

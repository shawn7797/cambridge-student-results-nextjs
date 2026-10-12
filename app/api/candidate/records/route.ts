// app/api/candidate/records/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user profile server-side to reliably access publicMetadata
    const user = await currentUser();
    const candidateId = user?.id;
    const username = user?.username;

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate ID not linked to your account." },
        { status: 400 },
      );
    }

    const client = await pool.connect();
    try {
      // 1. Fetch Candidate Profile
      const candidateRes = await client.query(
        "SELECT candidate_id, name FROM candidates WHERE clerk_user_id = $1",
        [candidateId],
      );
      const candidate = candidateRes.rows[0];

      if (!candidate) {
        return NextResponse.json(
          { error: "Candidate profile not found." },
          { status: 404 },
        );
      }

      // 2. Fetch Statements of Entry independently
      const entryRes = await client.query(
        "SELECT id, file_name, file_url, uploaded_at FROM statement_of_entry WHERE candidate_id = $1 ORDER BY uploaded_at DESC",
        [username],
      );

      // 3. Fetch Result Credentials independently
      const resultsCredsRes = await client.query(
        "SELECT id, username, password, release_date, release_details, file_name, file_url, created_at FROM result_password WHERE candidate_id = $1 ORDER BY created_at DESC",
        [username],
      );

      // 4. Fetch Statements of Result independently
      const resultsRes = await client.query(
        "SELECT id, file_name, file_url, created_at FROM statement_of_result WHERE candidate_id = $1 ORDER BY created_at DESC",
        [username],
      );

      return NextResponse.json({
        success: true,
        candidate,
        statementsOfEntry: entryRes.rows,
        resultCredentials: resultsCredsRes.rows,
        statementsOfResult: resultsRes.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error fetching candidate records:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

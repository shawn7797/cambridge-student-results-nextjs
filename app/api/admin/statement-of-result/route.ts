import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

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

    // 1. Upload bulk PDF temporarily so the QStash worker can fetch it
    const bulkBlob = await put(
      `statement_results/temp/bulk-${Date.now()}.pdf`,
      file,
      {
        access: "public",
        contentType: "application/pdf",
      },
    );

    // 2. Trigger QStash message to your worker route
    const workerEndpoint = `${process.env.NEXT_PUBLIC_APP_URL}/api/process-statement-of-results`;

    await qstash.publishJSON({
      url: workerEndpoint,
      body: {
        fileUrl: bulkBlob.url,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Statement of Results uploaded successfully. Processing in background workflow.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Upload initiation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

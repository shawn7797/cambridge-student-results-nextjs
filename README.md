# Cambridge ResultFlow

[![Vercel Deployment](https://img.shields.io/badge/vercel-deployed-success?logo=vercel&color=black)](https://cambridge-student-results-nextjs.vercel.app/)

A robust, automated full-stack web application designed to streamline the management, secure splitting, and publication of Cambridge International examination results, statements of entry, and electronic statements of results. It eliminates manual document distribution for Cambridge Exam Officers, significantly saving administrative time and minimizing human error.  
Built with **Next.js App Router**, **Clerk Authentication**, **PostgreSQL**, **Vercel Blob Storage**, **Upstash QStash**, and **unpdf**.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC)**: Secure routing and role-based navigation powered by Clerk `publicMetadata` distinguishing between Admin and Candidate roles.
- **Automated Statement of Results Splitting**: Uploads multi-candidate bulk PDF documents, automatically splits them page-by-page using `pdf-lib`, and stores individual files securely in Vercel Blob storage.
- **Reliable Asynchronous Background Workers**: Leverages **Upstash QStash** to offload heavy multi-page PDF parsing and file management from synchronous API routes, bypassing Vercel timeout constraints securely with signature verification.
- **Serverless-Native Text Extraction**: Employs **`unpdf`** for fast, dependency-safe text extraction designed specifically to run seamlessly in serverless environments without native canvas or `DOMMatrix` bundle issues.
- **Precise Centre-Code Anchoring**: Employs robust regular expression patterns anchored on the fixed centre number **AE021** (supporting both standard Latin and PDF font-encoded Greek character variants like `ΑΕ021`) alongside slash-prefixed candidate IDs.
- **Multi-Subject Result Management**: Stores multi-subject release details and schedules via flexible PostgreSQL `JSONB` columns (`result_password` table).
- **Idempotent Database Upserts**: Implements `ON CONFLICT (candidate_id) DO UPDATE` strategies within explicit transaction blocks to safely overwrite and update candidate records and storage links without duplicate key collisions.
- **Fault-Tolerant Batch Imports**: Features per-iteration try/catch isolation in background loops so that data anomalies on single records are logged gracefully without halting entire batch processes or corrupting storage cleanup routines.
- **Decoupled Data Architecture**: Result, entry, and statement upload tables are strictly isolated from the core `candidates` table to protect profile data integrity.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router with Server Components & Suspense streaming)
- **Authentication**: Clerk (`@clerk/nextjs`)
- **Database**: PostgreSQL (Neon / Vercel Postgres) via `pg` pool
- **File Storage**: Vercel Blob Storage (`@vercel/blob`)
- **Queue & Webhook Management**: Upstash QStash (`@upstash/qstash`)
- **PDF Processing & Parsing**: `pdf-lib` & `unpdf`
- **Styling & UI**: Tailwind CSS, Lucide Icons
- **Deployment**: Vercel

---

## 🗄️ Database Schema Overview

- **`candidates`**: Core student records table, securely protected from unintended modifications during document batch uploads.
- **`result_password`**: Manages result access credentials and multi-subject release configurations via JSONB fields.
- **`statement_of_entry`**: Tracks candidate entry details, subject registrations, and examination schedules.
- **`statement_of_result`**: Tracks metadata, local file identifiers, and public Vercel Blob URLs mapped to individual candidate numbers (requires a unique constraint on `candidate_id` for background upsert workflows).

---

## Getting Started

### Prerequisites

Ensure you have Node.js installed on your machine along with a configured PostgreSQL database, a Clerk account, and an Upstash QStash account.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_qstash_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_signing_key
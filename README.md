# Cambridge ResultFlow

[![Vercel Deployment](https://img.shields.io/badge/vercel-deployed-success?logo=vercel&color=black)](https://cambridge-student-results-nextjs.vercel.app/)

A robust, automated full-stack web application designed to streamline the management, secure splitting, and publication of Cambridge International examination results, statements of entry, and electronic statements of results. It eliminates manual document distribution for Cambridge Exam Officers, significantly saving administrative time and minimizing human error.\
Built with **Next.js App Router**, **Clerk Authentication**, **PostgreSQL**, and **Vercel Blob Storage**.

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC)**: Secure routing and role-based navigation powered by Clerk `publicMetadata` distinguishing between Admin and Candidate roles.
* **Automated Statement of Results Splitting**: Uploads multi-candidate bulk PDF documents, automatically splits them page-by-page using `pdf-lib`, and stores individual files securely in Vercel Blob storage.
* **Precise Centre-Code Anchoring**: Employs robust regular expression patterns anchored on the fixed centre number **AE021** (supporting both standard Latin and PDF font-encoded Greek character variants like `ΑΕ021`) alongside slash-prefixed candidate IDs.
* **Multi-Subject Result Management**: Stores multi-subject release details and schedules via flexible PostgreSQL `JSONB` columns (`result_password` table).
* **Asynchronous Background Processing**: Leverages Next.js native `after()` utility to offload heavy PDF manipulation and blob uploads to background workers, delivering instant submission feedback to administrators without risking serverless timeout limits.
* **Fault-Tolerant Batch Imports**: Features per-iteration try/catch isolation in background loops so that data anomalies or foreign key violations on single records (e.g., missing candidate profile entries) are logged gracefully without halting entire batch processes.
* **Decoupled Data Architecture**: Result, entry, and statement upload tables are strictly isolated from the core `candidates` table to protect profile data integrity.

---

## 🛠️ Tech Stack

* **Framework**: Next.js (App Router with Server Components & Suspense streaming)
* **Authentication**: Clerk (`@clerk/nextjs`)
* **Database**: PostgreSQL (Neon / Vercel Postgres) via `pg` pool
* **File Storage**: Vercel Blob Storage (`@vercel/blob`)
* **PDF Processing**: `pdf-lib` & `pdf-parse`
* **Styling & UI**: Tailwind CSS, Lucide Icons
* **Deployment**: Vercel

---

## 🗄️ Database Schema Overview

* **`candidates`**: Core student records table, securely protected from unintended modifications during document batch uploads.
* **`result_password`**: Manages result access credentials and multi-subject release configurations via JSONB fields.
* **`statement_of_entry`**: Tracks candidate entry details, subject registrations, and examination schedules.
* **`statement_of_result`**: Tracks metadata, local file identifiers, and public Vercel Blob URLs mapped to individual candidate numbers.

---

## Getting Started

### Prerequisites

Ensure you have Node.js installed on your machine along with a configured PostgreSQL database and a Clerk account.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
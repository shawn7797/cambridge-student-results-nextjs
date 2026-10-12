// app/admin/layout.tsx
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get userId and the built-in redirect helper from Clerk
  const { userId, redirectToSignIn } = await auth();

  // If not logged in, this automatically redirects to Clerk's hosted sign-in page
  if (!userId) {
    return redirectToSignIn();
  }

  // 2. Fetch user details from Clerk to verify admin role
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role;

  // 3. If a student tries to access /admin, redirect them home
  if (role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}

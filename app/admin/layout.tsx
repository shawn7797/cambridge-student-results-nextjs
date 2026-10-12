import Loading from "@/components/Loading";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get userId and redirect helper
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  // 2. Fetch user details to verify admin role
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role;

  // 3. Authorization check
  if (role !== "admin") {
    redirect("/");
  }

  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import * as s from "@/components/auth/auth-styles";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell title="Sign-in link didn't work">
      <div style={s.errorBanner}>{error || "The link may have expired, or already been used."}</div>
      <Link href="/login" className="pm-hoverable" style={{ ...s.primaryButton, display: "block", textDecoration: "none" }}>
        BACK TO SIGN IN
      </Link>
    </AuthShell>
  );
}

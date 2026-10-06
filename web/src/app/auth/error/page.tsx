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
    <AuthShell title="That link didn&rsquo;t work" subtitle="Sign-in links are single-use and expire quickly.">
      <div style={s.errorBanner}>{error || "The link may have expired, or already been used."}</div>
      <Link href="/login" className="pm-btn pm-btn-filled" style={{ ...s.primaryButton, textDecoration: "none" }}>
        Back to sign in
      </Link>
    </AuthShell>
  );
}

import { auth, signIn, signOut } from "@/auth";
import { MONO, SANS } from "@/lib/evidence-data";

// Server component: reads the session on the server and renders either a
// "Sign in" button (posts to a server action that calls Auth.js's signIn)
// or the signed-in user's name/avatar with a "Sign out" button. No client
// JS needed for either — both are plain <form> submissions.
export default async function AuthControls() {
  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button
          type="submit"
          className="pm-hoverable"
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: "#43494F",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </form>
    );
  }

  const name = session.user.name ?? session.user.email ?? "Account";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {session.user.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt=""
          width={22}
          height={22}
          referrerPolicy="no-referrer"
          style={{ borderRadius: "50%" }}
        />
      )}
      <span
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "#43494F",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="pm-hoverable"
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: "#767C83",
            background: "none",
            border: "1px solid #DDE1E4",
            borderRadius: 3,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

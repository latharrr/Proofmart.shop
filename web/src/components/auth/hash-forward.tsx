"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Some providers put the failure in the URL fragment (#error=…&error_code=…)
 * instead of the query, and the server never sees a fragment. When this page
 * rendered with no query, move a fragment error into the query once so the
 * server can explain it.
 */
export default function HashForward() {
  const router = useRouter();
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const from = new URLSearchParams(hash);
    const to = new URLSearchParams();
    for (const key of ["error", "error_code", "error_description"]) {
      const v = from.get(key);
      if (v) to.set(key, v.slice(0, 200));
    }
    if (to.toString()) router.replace(`/auth/error?${to}`);
  }, [router]);
  return null;
}

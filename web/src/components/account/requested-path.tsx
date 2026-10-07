"use client";

import { usePathname } from "next/navigation";

/** The address the visitor actually asked for, so the 404 can name it. */
export default function RequestedPath() {
  const path = usePathname();
  if (!path || path === "/") return <>this address</>;
  return <code className="pm-nf-path">{path.length > 64 ? `${path.slice(0, 63)}…` : path}</code>;
}

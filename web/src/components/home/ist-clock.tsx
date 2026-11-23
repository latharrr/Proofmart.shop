"use client";

import { useEffect, useState } from "react";

const FMT = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/** A live IST clock in mono. Renders a fixed-width placeholder on the server so hydration never mismatches and the bar never shifts. */
export default function IstClock({ className = "pm-clock" }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(FMT.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={className}>
      <time aria-label="Time in India" suppressHydrationWarning>
        {now ?? "--:--:--"}
      </time>{" "}
      IST
    </span>
  );
}

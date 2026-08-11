"use client";

import { useEffect, useState } from "react";

export default function StarterBootstrap({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function run() {
      try {
        setStatus("Finding the first real stores…");
        const response = await fetch("/api/bootstrap-starter", {
          method: "POST",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.ok && data.importedStores > 0) {
          setStatus(`Imported ${data.importedStores} stores and ${data.importedProducts} products. Refreshing…`);
          window.setTimeout(() => window.location.reload(), 700);
        } else if (response.ok && data.alreadySeeded) {
          setStatus("");
        } else {
          setStatus(data.message || "Starter import did not find a usable store yet.");
        }
      } catch {
        if (!cancelled) setStatus("Starter import could not run right now.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled || !status) return null;
  return (
    <p style={{ textAlign: "center", margin: "12px 0 0", fontSize: 14, opacity: 0.68 }}>
      {status}
    </p>
  );
}

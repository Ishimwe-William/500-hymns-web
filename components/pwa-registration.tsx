"use client";

import { useEffect } from "react";
import { offlineCommand } from "@/lib/offline-client";

export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Browsing still works if browser policy prevents service workers.
      console.warn("App installation support could not be initialized.");
    });
    let lastCheck = 0;
    const check = () => {
      if (!navigator.onLine || document.visibilityState === "hidden" || Date.now() - lastCheck < 300000) return;
      lastCheck = Date.now();
      void offlineCommand("CHECK").catch(() => {});
    };
    const online = () => { lastCheck = 0; setTimeout(check, 1500); };
    const navigateOffline = (event: MouseEvent) => {
      if (navigator.onLine || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.origin !== location.origin || !/^\/(hymns|favorites|recent)(\/|$)/.test(anchor.pathname)) return;
      event.preventDefault(); event.stopPropagation(); location.assign(anchor.href);
    };
    check();
    const timer = setInterval(check, 300000);
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", check);
    document.addEventListener("click", navigateOffline, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", online);
      document.removeEventListener("visibilitychange", check);
      document.removeEventListener("click", navigateOffline, true);
    };
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function FinalRoundGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isVotingPage = pathname === "/participant/voting";

  useEffect(() => {
    if (!isVotingPage) {
      router.replace("/participant/voting");
    }
  }, [isVotingPage, router]);

  if (!isVotingPage) {
    return null;
  }

  // On the voting page, render children in a clean full-screen layout
  // hiding sidebar, top bar, and bottom nav
  return (
    <>
      <style>{`
        .lg\\:ml-64 { margin-left: 0 !important; }
        aside { display: none !important; }
        nav:last-child { display: none !important; }
        header { display: none !important; }
        [class*="fixed"][class*="top-0"] { display: none !important; }
        [class*="fixed"][class*="bottom-0"] { display: none !important; }
        main { padding-top: 0 !important; padding-bottom: 0 !important; }
      `}</style>
      {children}
    </>
  );
}

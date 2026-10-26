"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  // Ref instead of module-level state: module state is shared across SSR requests
  // and produced different server HTML per request (React hydration mismatch).
  const previousPathname = useRef<string | null>(null);

  // Determine direction: deeper = navigating to a longer path (slide from right),
  // back = navigating to a shorter path (slide from left).
  const isDeeper = previousPathname.current === null || pathname.length >= previousPathname.current.length;

  useEffect(() => {
    previousPathname.current = pathname;
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={
          reduced
            ? undefined
            : {
                opacity: 0,
                x: isDeeper ? 12 : -12,
                filter: "blur(4px)",
              }
        }
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={
          reduced
            ? undefined
            : {
                opacity: 0,
                x: isDeeper ? -12 : 12,
                filter: "blur(4px)",
              }
        }
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

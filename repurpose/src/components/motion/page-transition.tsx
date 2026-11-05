"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { pageEnter } from "./motion.config";

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={pageEnter}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

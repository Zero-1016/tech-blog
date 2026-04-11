"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PostHeader({ children }: { children: ReactNode }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      {children}
    </motion.header>
  );
}

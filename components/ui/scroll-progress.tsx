"use client";

import { motion, useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import { useRef } from "react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const visible = useRef(false);
  const divRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const shouldShow = v > 0.02;
    if (visible.current !== shouldShow) {
      visible.current = shouldShow;
      if (divRef.current) {
        divRef.current.style.opacity = shouldShow ? "1" : "0";
      }
    }
  });

  return (
    <motion.div
      ref={divRef}
      style={{ scaleX, transformOrigin: "0%", opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-accent transition-opacity"
    />
  );
}

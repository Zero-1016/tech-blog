"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => setShow(v > 0.02));
  }, [scrollYProgress]);

  if (!show) return null;

  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0%" }}
      className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-accent"
    />
  );
}

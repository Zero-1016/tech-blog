"use client";

import { motion } from "framer-motion";

interface Step {
  title: string;
  content: string;
  code?: string;
}

interface AnimatedStepProps {
  steps: Step[];
}

export function AnimatedStep({ steps }: AnimatedStepProps) {
  return (
    <div className="my-8 flex flex-col gap-6">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: i * 0.15 }}
          className="rounded-lg border border-border p-5"
        >
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {i + 1}
            </span>
            <h4 className="font-semibold">{step.title}</h4>
          </div>
          <p className="text-sm leading-relaxed text-secondary">{step.content}</p>
          {step.code && (
            <pre className="mt-3 overflow-x-auto rounded-md bg-code-bg p-3 text-sm">
              <code className="font-mono">{step.code}</code>
            </pre>
          )}
        </motion.div>
      ))}
    </div>
  );
}

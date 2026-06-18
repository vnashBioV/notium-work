"use client";

import { MotionConfig } from "framer-motion";

type MotionProviderProps = {
  children: React.ReactNode;
};

export default function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionConfig>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';

const quotes = [
  {
    title: "Every Great Idea Starts with Clarity",
    text: "The best ideas don't appear in chaos; they emerge when your mind is clear. Novaq helps you distill your thoughts into actionable plans, bringing your vision into focus.",
  },
  {
    title: "Small Steps Create Big Change",
    text: "Greatness is built day by day. Novaq helps you take one step at a time toward your dream, turning small wins into momentum.",
  },
  {
    title: "Dream Bold, Plan Smart",
    text: "Big dreams don't have to be overwhelming. With Novaq, every goal becomes a set of clear, achievable steps you can follow.",
  },
  {
    title: "Focus Is Your Superpower",
    text: "In a noisy world, clarity and focus give you the edge. Novaq keeps distractions away and your vision front and center.",
  },
];

const Motivation = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="dashboard-card-border rounded-[24px] bg-white/78 p-5 transition-all duration-500 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f1ebff_0%,#e1dbff_100%)] text-[#6d5dff]"
        >
          <Quote className="h-5 w-5" />
        </motion.div>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={quotes[index].title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.38 }}
            >
              <h2 className="text-[1.1rem] font-bold tracking-[-0.02em] text-slate-950">{quotes[index].title}</h2>
              <div className="mt-3 border-l-2 border-[#7a6bff] pl-4">
                <p className="max-w-3xl text-[13px] leading-6 text-slate-600 sm:text-sm">{quotes[index].text}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Motivation;

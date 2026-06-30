/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Flame } from 'lucide-react';
import { Theme } from '../themes';

interface NewThemeUnlockedModalProps {
  theme: Theme;
  onClose: () => void;
  onApplyTheme: (themeId: string) => void;
}

function ElegantSparkles() {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 15 + 8,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 2,
    }));
    setSparkles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-[32px]">
      {sparkles.map((s) => (
        <motion.svg
          key={s.id}
          className="absolute fill-current text-amber-300"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
          }}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.2, 0.8, 1.1, 0],
            opacity: [0, 0.9, 0.8, 0.9, 0],
            rotate: [0, 45, 90, 135, 180],
            y: [0, -30 - Math.random() * 50],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          viewBox="0 0 24 24"
        >
          <path className="golden-sparkle-path" d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
        </motion.svg>
      ))}
    </div>
  );
}

export default function NewThemeUnlockedModal({ theme, onClose, onApplyTheme }: NewThemeUnlockedModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2F3E2E]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90]"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="bg-white rounded-[32px] shadow-2xl border border-[#4F8A5B]/10 max-w-md w-full p-6 md:p-8 relative overflow-hidden text-center flex flex-col items-center"
      >
        <ElegantSparkles />

        {/* Level Emblem with Ring Glow */}
        <div className="relative mb-5 mt-2 z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-3xl font-serif font-black text-amber-900 leading-none">
              Lv.{theme.levelRequired}
            </span>
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-dashed border-amber-300 animate-spin" style={{ animationDuration: '20s' }} />
        </div>

        <div className="space-y-2 relative z-10">
          <span className="text-[10px] uppercase tracking-widest text-[#4F8A5B] font-black bg-[#EAF2EC] px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            New Theme Unlocked!
          </span>
          <h2 className="text-2xl font-serif font-black text-[#2F3E2E]">
            {theme.name} {theme.emoji}
          </h2>
          <p className="text-sm text-slate-500 italic max-w-sm mx-auto leading-relaxed px-2">
            "{theme.description}"
          </p>
        </div>

        {/* Small theme colors strip */}
        <div className="flex gap-1.5 mt-5 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100 z-10">
          <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: theme.colors.bg }} title="Canvas Backing" />
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }} title="Primary Theme Color" />
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.accent }} title="Accent Color" />
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.lightBg }} title="Active Element Tint" />
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.text }} title="Typography Ink" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full relative z-10">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none"
          >
            Maybe Later
          </button>
          <button
            onClick={() => onApplyTheme(theme.id)}
            className="flex-1 bg-[#4F8A5B] text-white hover:bg-[#3E6B48] py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Apply Theme
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

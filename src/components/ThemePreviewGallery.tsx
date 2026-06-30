/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { THEMES, Theme, getThemeById } from '../themes';
import { Sparkles, Check, Lock, Award, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemePreviewGalleryProps {
  growthPoints: number;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
  levelInfo: {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    percent: number;
  };
}

export default function ThemePreviewGallery({
  growthPoints,
  currentThemeId,
  onSelectTheme,
  levelInfo
}: ThemePreviewGalleryProps) {
  const currentTheme = getThemeById(currentThemeId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Level and XP Header Card */}
      <div className="bg-gradient-to-br from-[#EAF2EC] to-[#F6F8F2] rounded-3xl p-6 md:p-8 border border-[#4F8A5B]/15 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#4F8A5B]/5 rounded-full blur-2xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[#4F8A5B] font-black bg-white px-2.5 py-1 rounded-full border border-[#4F8A5B]/10 w-fit block">
              ⭐ Growth & Appearance
            </span>
            <h2 className="text-2xl font-serif font-black text-[#2F3E2E]">Personalization Vault</h2>
            <p className="text-xs text-slate-500 max-w-md">
              Complete focus tasks to gain XP, level up, and unlock elegant workspaces crafted for your mental peace.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/70 backdrop-blur-xs p-4 rounded-2xl border border-white shrink-0 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#4F8A5B] to-[#A7C957] flex items-center justify-center text-white font-serif font-black text-xl shadow-md">
              Lv.{levelInfo.level}
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-black text-[#2F3E2E] block">Level Progress</span>
              <div className="text-[11px] text-slate-400 font-bold flex justify-between gap-8">
                <span>{levelInfo.currentXP} / {levelInfo.nextLevelXP} XP</span>
                <span>Total: {growthPoints} XP</span>
              </div>
              <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-[#4F8A5B] to-[#A7C957] transition-all duration-500"
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-serif font-black text-[#2F3E2E] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#4F8A5B]" /> Custom Theme Library
          </h3>
          <span className="text-[10px] uppercase font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {THEMES.filter(t => levelInfo.level >= t.levelRequired).length} / {THEMES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {THEMES.map((theme) => {
            const isUnlocked = levelInfo.level >= theme.levelRequired;
            const isActive = currentThemeId === theme.id;

            return (
              <div
                key={theme.id}
                className={`group rounded-3xl p-5 border relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                  isActive
                    ? 'bg-white border-[#4F8A5B] shadow-md ring-2 ring-[#4F8A5B]/10'
                    : isUnlocked
                    ? 'bg-white border-slate-200 hover:border-[#4F8A5B]/30 hover:shadow-xs'
                    : 'bg-[#F9FAFB]/90 border-slate-100 opacity-90'
                }`}
              >
                {/* Visual Lock/Unlock Corner Tag */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  {isActive ? (
                    <span className="text-[10px] font-black uppercase text-white bg-[#4F8A5B] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Active
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-[9px] font-black uppercase text-[#4F8A5B] bg-[#EAF2EC] px-2.5 py-1 rounded-full">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked (Lv.{theme.levelRequired})
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 pr-20">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{theme.emoji}</span>
                    <div>
                      <h4 className="text-sm font-serif font-black text-[#2F3E2E] leading-tight">
                        {theme.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Requires Level {theme.levelRequired}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {theme.description}
                  </p>
                </div>

                {/* Simulated Interface Preview Area (Theme Mockup) */}
                <div className="my-4 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-4">
                  <div className="text-[9px] font-bold text-slate-400">Preview:</div>
                  <div className="flex-1 flex gap-2 justify-end">
                    {/* Mock Card with Theme Colors */}
                    <div
                      className="rounded-lg p-1.5 border flex flex-col gap-1 w-24 shrink-0 transition-all shadow-2xs"
                      style={{
                        backgroundColor: theme.colors.cardBg,
                        borderColor: isUnlocked ? theme.colors.lightBg : '#E2E8F0',
                      }}
                    >
                      <div className="h-1 w-8 rounded-full" style={{ backgroundColor: isUnlocked ? theme.colors.primary : '#94A3B8' }} />
                      <div className="h-0.5 w-12 rounded-full" style={{ backgroundColor: isUnlocked ? theme.colors.accent : '#CBD5E1' }} />
                      <div className="h-1.5 w-full rounded-md mt-1" style={{ backgroundColor: isUnlocked ? theme.colors.lightBg : '#F1F5F9' }} />
                    </div>

                    {/* Mock Action Button */}
                    <div
                      className="rounded-lg px-2 py-1 flex items-center justify-center text-[8px] font-black text-white w-16 h-8 shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: isUnlocked ? theme.colors.primary : '#94A3B8',
                      }}
                    >
                      Button
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50 z-10">
                  <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: theme.colors.bg }} title="Canvas Backing" />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} title="Theme Primary" />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} title="Theme Accent" />
                  </div>

                  {isUnlocked ? (
                    isActive ? (
                      <button
                        disabled
                        className="bg-slate-50 border border-slate-200 text-slate-400 px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 outline-none"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        In Use
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectTheme(theme.id)}
                        className="bg-[#4F8A5B] hover:bg-[#3E6B48] text-white px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer outline-none border-none"
                      >
                        Apply Theme
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/40">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Locked at Level {theme.levelRequired}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

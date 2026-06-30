/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { Play, Pause, Square, CheckCircle, Wind, Volume2, VolumeX, ChevronRight, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FocusSessionModalProps {
  task: Task;
  onClose: () => void;
  onComplete: (taskId: string) => void;
}

export default function FocusSessionModal({ task, onClose, onComplete }: FocusSessionModalProps) {
  const [timeLeft, setTimeLeft] = useState(task.estimatedDuration * 60);
  const [isActive, setIsActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Breathing coach phase cycles (4s inhale, 4s hold, 4s exhale)
  useEffect(() => {
    if (!isActive) return;
    const breathInterval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(breathInterval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSubtaskLocal = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleFinishEarly = () => {
    onComplete(task.id);
  };

  // Percentage progress of focus time
  const totalSeconds = task.estimatedDuration * 60;
  const elapsedSeconds = totalSeconds - timeLeft;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2F3E2E]/95 backdrop-blur-md flex items-center justify-center p-4 z-[90] overflow-y-auto text-white"
    >
      <div className="w-full max-w-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          title="Exit Session"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Timer & Breathing Animation (7 Cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center text-center space-y-6">
            <span className="text-[10px] uppercase tracking-widest text-[#A7C957] font-black bg-white/10 px-3 py-1 rounded-full">
              Mindful Focus Chamber
            </span>

            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-[#F6F8F2] tracking-tight">{task.title}</h2>
              <p className="text-white/60 text-xs max-w-md mx-auto">{task.description || 'Deep focus in progress'}</p>
            </div>

            {/* Breathing Animation Ring & Digital Timer */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Pulsing breathing background circles */}
              <AnimatePresence mode="popLayout">
                {isActive && (
                  <motion.div
                    key={breathPhase}
                    initial={{ scale: breathPhase === 'Inhale' ? 0.8 : breathPhase === 'Hold' ? 1.15 : 1.3, opacity: 0.15 }}
                    animate={{
                      scale: breathPhase === 'Inhale' ? 1.25 : breathPhase === 'Hold' ? 1.25 : 0.85,
                      opacity: breathPhase === 'Hold' ? 0.35 : 0.15,
                    }}
                    transition={{ duration: 4, ease: 'easeInOut' }}
                    className={`absolute inset-0 rounded-full ${
                      breathPhase === 'Inhale' ? 'bg-[#A7C957]' : 'bg-[#4F8A5B]'
                    }`}
                  />
                )}
              </AnimatePresence>

              {/* Central clock dial */}
              <div className="w-52 h-52 rounded-full border-4 border-white/10 bg-[#2F3E2E] shadow-2xl flex flex-col items-center justify-center relative z-10">
                {/* SVG Ring Progress */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="104"
                    cy="104"
                    r="96"
                    stroke="rgba(167, 201, 87, 0.2)"
                    strokeWidth="4"
                    fill="transparent"
                    className="translate-x-[4px] translate-y-[4px]"
                  />
                  <circle
                    cx="104"
                    cy="104"
                    r="96"
                    stroke="#A7C957"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 96}
                    strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
                    className="translate-x-[4px] translate-y-[4px] transition-all duration-1000"
                  />
                </svg>

                <div className="space-y-1 relative z-20">
                  <span className="font-mono text-4xl font-extrabold tracking-widest text-[#F6F8F2]">
                    {formatTime(timeLeft)}
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest">
                      {progressPercent}% Elapsed
                    </span>
                    {isActive && (
                      <span className="text-[11px] font-bold text-[#A7C957] animate-pulse flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 animate-spin duration-3000" />
                        {breathPhase}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-4 relative z-20">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isActive ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#A7C957] hover:bg-[#86A83E] text-[#2F3E2E]'
                }`}
              >
                {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleFinishEarly}
                className="bg-[#4F8A5B] hover:bg-[#3E6B48] text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Finish & Verify Task
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
                Cancel Session
              </button>
            </div>
          </div>

          {/* Right Column: Focus Companion & Subtasks (5 Cols) */}
          <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 relative z-10 self-stretch flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-sm font-serif font-bold text-[#A7C957] uppercase tracking-wider">Subtask Focus Roadmap</h3>
                <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                  {subtasks.filter((s) => s.completed).length}/{subtasks.length} Done
                </span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubtaskLocal(sub.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      sub.completed
                        ? 'bg-[#4F8A5B]/20 border-[#4F8A5B]/30 text-white/50'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        sub.completed ? 'bg-[#4F8A5B] border-[#4F8A5B] text-white' : 'border-white/30 text-transparent'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={`text-xs ${sub.completed ? 'line-through' : ''}`}>
                      {sub.title}
                    </span>
                  </div>
                ))}

                {subtasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-white/40 italic">No subtasks found for this task.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quiet reminder quote */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#A7C957] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">Astra's Reminder</span>
                <p className="text-[11px] text-white/80 leading-relaxed italic">
                  "Savor the silence between breaths. Give this single action your entire presence."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

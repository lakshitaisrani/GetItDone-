/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Check, Calendar, AlertTriangle, HelpCircle, Bot, Loader2, ArrowRight } from 'lucide-react';

interface PlanMyDayModalProps {
  tasks: Task[];
  onClose: () => void;
  onApplyPlan: (updatedTasks: Task[]) => void;
}

export default function PlanMyDayModal({ tasks, onClose, onApplyPlan }: PlanMyDayModalProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const calculatePlan = async () => {
      try {
        const res = await fetch('/api/astra/plan-my-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks }),
        });
        if (!res.ok) throw new Error('Failed to fetch daily plan');
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Error generating daily plan:", err);
        setError("Astra had a brief distraction. Let's try generating the plan again.");
      } finally {
        setLoading(false);
      }
    };

    calculatePlan();
  }, [tasks]);

  const handleAccept = () => {
    if (!result || !result.tasks) {
      onClose();
      return;
    }

    // Build the updated list of tasks with recommended schedules
    const updatedTasks = tasks.map((t) => {
      const recommendation = result.tasks.find((rt: any) => rt.id === t.id);
      if (recommendation) {
        return {
          ...t,
          recommendedSchedule: recommendation.recommendedSchedule,
          suggestedCompletionTime: recommendation.suggestedCompletionTime,
        };
      }
      return t;
    });

    onApplyPlan(updatedTasks);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2F3E2E]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90] overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white rounded-[32px] shadow-2xl border border-[#4F8A5B]/10 max-w-2xl w-full p-6 md:p-8 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAF2EC]/50 rounded-full blur-2xl -z-10" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#2F3E2E] hover:bg-slate-50 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#4F8A5B] animate-spin" />
            <div className="space-y-1">
              <p className="font-serif font-black text-lg text-[#2F3E2E]">Harmonizing Your Focus Day...</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Astra is balancing task priorities, resolving schedule overlaps, and crafting a spacious breathing roadmap.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#2F3E2E]">{error}</p>
            <button
              onClick={onClose}
              className="bg-[#4F8A5B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#3E6B48] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-[#4F8A5B] font-black bg-[#EAF2EC] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                Astra's Day Plan Insight
              </span>
              <h2 className="text-2xl font-serif font-black text-[#2F3E2E]">Optimized Focus Roadmap</h2>
              <p className="text-xs text-slate-400">
                Astra reviewed your {tasks.filter(t => t.status === 'Pending').length} pending tasks. Here is the recommended sequence:
              </p>
            </div>

            {/* AI Insights & Alerts (Requirement 3: Astra's Insight) */}
            {result.insights && result.insights.length > 0 && (
              <div className="space-y-2">
                {result.insights.map((insight: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-amber-50/75 border border-amber-200/50 p-4 rounded-2xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-amber-800 uppercase tracking-wide">
                        Astra's Insight: {insight.title}
                      </span>
                      <p className="text-xs text-amber-700 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optimized Task Schedule Sequence */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {tasks.filter((t) => t.status === 'Pending').map((task, idx) => {
                const recommendation = result.tasks?.find((rt: any) => rt.id === task.id);
                return (
                  <div
                    key={task.id}
                    className="bg-[#F6F8F2]/40 border border-slate-100 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#4F8A5B]/15 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#EAF2EC] text-[#4F8A5B] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#2F3E2E]">{task.title}</p>
                        <p className="text-[10px] text-slate-400">Duration: {task.estimatedDuration} mins</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/80 border border-slate-100 rounded-xl px-3 py-1.5 self-start md:self-auto shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#4F8A5B]" />
                      <div className="text-[10px]">
                        <span className="text-slate-400 block font-semibold leading-none">Schedule Recommendation</span>
                        <span className="text-[#2F3E2E] font-bold mt-0.5 block">
                          {recommendation ? recommendation.recommendedSchedule : 'Today at a flexible time'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explainable AI block (Requirement 2 & 1) */}
            <div className="bg-[#EAF2EC]/40 p-4 rounded-2xl border border-[#4F8A5B]/10">
              <h4 className="text-xs font-bold text-[#2F3E2E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#4F8A5B]" /> Why Astra suggested this?
              </h4>
              <p className="text-xs text-[#2F3E2E] leading-relaxed italic">
                {result.whySuggested || "Why I suggested this: By scheduling tasks in a clear sequence and separating high-intensity milestones, we ensure your focus flows smoothly and naturally."}
              </p>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 pt-3 border-t border-slate-50">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Keep Current Plan
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 bg-[#4F8A5B] text-white hover:bg-[#3E6B48] py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Accept Recommendation
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

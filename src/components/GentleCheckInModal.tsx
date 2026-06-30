/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, TaskPriority, TaskType, Subtask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  Calendar, 
  Check, 
  ArrowRight, 
  X, 
  Brain, 
  Coffee, 
  Clock, 
  HelpCircle, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface GentleCheckInModalProps {
  originalTask: Task;
  targetDeadline: string;
  onAcceptRecommendation: (modifiedTaskData?: any) => void;
  onContinuePostponing: () => void;
  onClose: () => void;
}

type RescheduleReason = 'busy' | 'tired' | 'time' | 'overwhelming' | 'forgot' | 'other';

export default function GentleCheckInModal({
  originalTask,
  targetDeadline,
  onAcceptRecommendation,
  onContinuePostponing,
  onClose
}: GentleCheckInModalProps) {
  const [selectedReason, setSelectedReason] = useState<RescheduleReason | null>(null);

  const reasons = [
    { id: 'busy' as RescheduleReason, label: "I'm too busy", emoji: "💼" },
    { id: 'tired' as RescheduleReason, label: "I'm too tired", emoji: "💤" },
    { id: 'time' as RescheduleReason, label: "I don't have enough time", emoji: "⏳" },
    { id: 'overwhelming' as RescheduleReason, label: "The task feels overwhelming", emoji: "🌋" },
    { id: 'forgot' as RescheduleReason, label: "I forgot", emoji: "💭" },
    { id: 'other' as RescheduleReason, label: "Something else...", emoji: "❓" }
  ];

  // Astra's intelligent, supportive suggestions based on reason selection
  const getAstraResponse = (reason: RescheduleReason) => {
    switch (reason) {
      case 'busy':
        return {
          title: "Optimize Your Load",
          suggestion: "I understand your schedule is packed. Let's keep this important task on today's agenda, and instead, we can move a lower-priority task to tomorrow to make some breathing room.",
          recommendationText: "Keep task today and free up lower-priority slots",
          getModifiedData: () => ({
            // Keeps original deadline
            deadline: originalTask.deadline,
            planExplanation: "Prioritized over lower-priority tasks to maintain today's schedule."
          })
        };
      case 'tired':
        return {
          title: "Reduce Today's Goal",
          suggestion: "Energy levels fluctuate. Instead of postponing this completely, how about keeping it on today's list but reducing our goal? Spend just 5 minutes on the absolute easiest part.",
          recommendationText: "Keep task today but shorten duration to 5 mins",
          getModifiedData: () => ({
            deadline: originalTask.deadline,
            title: `${originalTask.title} (5-Min Tiny Step)`,
            estimatedDuration: 5,
            planExplanation: "Reduced to a 5-minute initial task to accommodate energy levels."
          })
        };
      case 'time':
        return {
          title: "Create Focused Gaps",
          suggestion: "Time feels tight today. Let's keep it scheduled for today as a lightweight reminder, or try to protect just a 10-minute slot later this afternoon when you can approach it with complete focus.",
          recommendationText: "Keep today as a light 10-minute placeholder",
          getModifiedData: () => ({
            deadline: originalTask.deadline,
            estimatedDuration: 10,
            planExplanation: "Scheduled a quick 10-minute focus window."
          })
        };
      case 'overwhelming':
        return {
          title: "Divide and Conquer",
          suggestion: "It's completely normal to feel overwhelmed. Let's keep the task today, but I will help deconstruct it into small, bite-sized subtasks. Smaller pieces are much easier to handle.",
          recommendationText: "Keep today and split into clear, simple subtasks",
          getModifiedData: () => {
            const currentSubtasks = originalTask.subtasks || [];
            const newSubtasks: Subtask[] = [
              { id: `sub-${Date.now()}-1`, title: "Gather required notes & review details", completed: false },
              { id: `sub-${Date.now()}-2`, title: "Draft just the first small item", completed: false },
              { id: `sub-${Date.now()}-3`, title: "Review the initial progress", completed: false }
            ];
            return {
              deadline: originalTask.deadline,
              subtasks: [...currentSubtasks, ...newSubtasks],
              planExplanation: "Deconstructed into simple, step-by-step subtasks."
            };
          }
        };
      case 'forgot':
        return {
          title: "Elevate Visibility",
          suggestion: "Out of sight can easily mean out of mind! Let's keep it on today's layout and I will elevate its visual priority with a notification prefix to help keep it at the front of your thoughts.",
          recommendationText: "Keep today and add a priority notice flag",
          getModifiedData: () => ({
            deadline: originalTask.deadline,
            priority: 'High' as TaskPriority,
            title: `🔔 [Astra Reminder] ${originalTask.title}`,
            planExplanation: "Elevated priority and visibility to prevent oversight."
          })
        };
      case 'other':
      default:
        return {
          title: "Structured Pacing",
          suggestion: "Every day has unique demands. Let's try clearing your physical workspace, setting a short timer, and engaging with this task for just 3 quiet minutes today.",
          recommendationText: "Keep task today and try a 3-minute focus session",
          getModifiedData: () => ({
            deadline: originalTask.deadline,
            planExplanation: "Set a 3-minute quick focus session to initiate progress."
          })
        };
    }
  };

  const astraResponse = selectedReason ? getAstraResponse(selectedReason) : null;

  return (
    <div className="fixed inset-0 bg-[#2F3E2E]/40 backdrop-blur-xs flex items-center justify-center z-[90] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-white/50 overflow-hidden relative"
      >
        {/* Calming gradient top strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4F8A5B] to-[#A7C957]" />

        {/* Header */}
        <div className="p-6 md:p-8 pb-4 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-serif font-black text-[#2F3E2E]">
              🌿 Gentle Check-In
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedReason ? (
              /* Step 1: Ask for Reason */
              <motion.div
                key="step-reason"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 bg-[#F6F8F2]/60 p-4 rounded-2xl border border-[#4F8A5B]/10">
                  <Bot className="w-5 h-5 text-[#4F8A5B] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#2F3E2E] font-medium leading-relaxed">
                    "Before we move this task, what's getting in your way today?"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {reasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className="w-full text-left bg-[#F6F8F2]/30 hover:bg-[#EAF2EC] border border-slate-100 hover:border-[#4F8A5B]/20 p-3.5 rounded-2xl text-xs text-[#2F3E2E] font-bold transition-all flex items-center gap-3 cursor-pointer outline-none"
                    >
                      <span className="text-base">{reason.emoji}</span>
                      <span>{reason.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Step 2: Show Astra Recommendation */
              <motion.div
                key="step-recommendation"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-50">
                  <span className="text-[10px] uppercase tracking-widest font-black text-[#4F8A5B] bg-[#EAF2EC] px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#A7C957] fill-current" />
                    Astra's Suggestion
                  </span>
                </div>

                <div className="bg-[#4F8A5B] text-white p-5 rounded-2xl relative overflow-hidden space-y-3 shadow-xs">
                  <div className="absolute right-3 top-3 opacity-10">
                    <Lightbulb className="w-16 h-16" />
                  </div>
                  <h4 className="text-sm font-serif font-bold flex items-center gap-1.5">
                    💡 {astraResponse?.title}
                  </h4>
                  <p className="text-xs text-white/90 leading-relaxed font-sans">
                    {astraResponse?.suggestion}
                  </p>
                </div>

                {/* Main Choice Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      const modified = astraResponse?.getModifiedData();
                      onAcceptRecommendation(modified);
                    }}
                    className="w-full bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3.5 px-4 rounded-2xl text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{astraResponse?.recommendationText}</span>
                  </button>

                  <button
                    onClick={onContinuePostponing}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none"
                  >
                    <span>Continue Postponing</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSelectedReason(null)}
                    className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors pt-1 cursor-pointer bg-transparent border-none outline-none"
                  >
                    ← Back to reasons
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

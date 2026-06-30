/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TaskType, TaskPriority } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Calendar, Clock, ShieldCheck, Check, Edit2, X, Plus } from 'lucide-react';

interface ParsedTask {
  title: string;
  taskType: TaskType;
  deadline: string;
  estimatedDuration: number;
  priority: TaskPriority;
  verificationMethod: string;
}

interface ParsedTasksReviewCardProps {
  initialTasks: ParsedTask[];
  onApprove: (tasks: ParsedTask[]) => void;
  onCancel: () => void;
}

const TASK_TYPES: TaskType[] = [
  'Study',
  'Assignment',
  'Bills',
  'Workout',
  'Reading',
  'Meeting',
  'Shopping',
  'Personal',
  'Other'
];

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

const VERIFICATION_METHODS = [
  'AI Knowledge Check',
  'Screenshot',
  'Document',
  'Image',
  'No Verification',
  'Short Reflection'
];

export default function ParsedTasksReviewCard({ initialTasks, onApprove, onCancel }: ParsedTasksReviewCardProps) {
  const [tasks, setTasks] = useState<ParsedTask[]>(() =>
    initialTasks.map(t => ({
      ...t,
      taskType: t.taskType || 'Other',
      priority: t.priority || 'Medium',
      deadline: t.deadline || new Date().toLocaleDateString('en-CA'),
      estimatedDuration: t.estimatedDuration || 30,
      verificationMethod: t.verificationMethod || 'Short Reflection'
    }))
  );
  const [approved, setApproved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateField = (index: number, field: keyof ParsedTask, value: any) => {
    setTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteTask = (index: number) => {
    setTasks(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCreate = () => {
    if (tasks.length === 0) return;
    onApprove(tasks);
    setApproved(true);
  };

  if (tasks.length === 0 && !approved) {
    return (
      <div className="mt-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-center">
        <p className="text-xs text-slate-500 font-medium">All suggested tasks removed.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-[#F6F8F2] border border-[#4F8A5B]/15 rounded-2xl p-4 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#4F8A5B]/10 pb-2">
        <span className="text-[11px] font-black text-[#4F8A5B] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#4F8A5B]" />
          Astra Task Extractor ({tasks.length})
        </span>
        {approved ? (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[2.5]" /> Created
          </span>
        ) : (
          <span className="text-[9px] text-[#4F8A5B]/80 font-semibold uppercase tracking-wider">
            {isEditing ? 'Editing Mode' : 'Ready to Add'}
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {tasks.map((task, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-2.5 relative hover:border-[#4F8A5B]/15 transition-all shadow-xs"
            >
              {isEditing && (
                <button
                  onClick={() => handleDeleteTask(idx)}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                  title="Remove Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {isEditing ? (
                // Editing Layout
                <div className="space-y-3">
                  {/* Title input */}
                  <div className="space-y-0.5 pr-6">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateField(idx, 'title', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2F3E2E] outline-none focus:bg-white focus:border-[#4F8A5B] transition-colors"
                    />
                  </div>

                  {/* Grid fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Task Type
                      </label>
                      <select
                        value={task.taskType}
                        onChange={(e) => handleUpdateField(idx, 'taskType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[#4F8A5B]"
                      >
                        {TASK_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Priority
                      </label>
                      <select
                        value={task.priority}
                        onChange={(e) => handleUpdateField(idx, 'priority', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[#4F8A5B]"
                      >
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" /> Deadline
                      </label>
                      <input
                        type="date"
                        value={task.deadline}
                        onChange={(e) => handleUpdateField(idx, 'deadline', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[#4F8A5B]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" /> Duration (min)
                      </label>
                      <input
                        type="number"
                        value={task.estimatedDuration}
                        onChange={(e) => handleUpdateField(idx, 'estimatedDuration', parseInt(e.target.value, 10) || 30)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[#4F8A5B]"
                      />
                    </div>
                  </div>

                  {/* Verification Method Selection */}
                  <div className="space-y-0.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-slate-400" /> Verification Method
                    </label>
                    <select
                      value={task.verificationMethod}
                      onChange={(e) => handleUpdateField(idx, 'verificationMethod', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[#4F8A5B]"
                    >
                      {VERIFICATION_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                // Display / Read-only Layout (Beautiful visual badges)
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#2F3E2E]">{task.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {task.taskType}
                      </span>
                      <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${
                        task.priority === 'High' ? 'bg-red-50 text-red-600' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#4F8A5B]/70" /> Deadline: {task.deadline}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#4F8A5B]/70" /> {task.estimatedDuration}m
                    </span>
                    <span className="flex items-center gap-1 text-[#4F8A5B]">
                      <ShieldCheck className="w-3 h-3" /> {task.verificationMethod}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!approved && (
        <div className="pt-1.5 border-t border-[#4F8A5B]/10">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="w-full bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Create Task
              </button>
              
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white hover:bg-slate-50 text-[#2F3E2E] border border-slate-200/80 py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>

              <button
                onClick={onCancel}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-100 py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

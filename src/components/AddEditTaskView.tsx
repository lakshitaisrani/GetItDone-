/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task, TaskType, TaskPriority } from '../types';
import { getTaskTypeStyles } from './TaskCard';
import { X, Calendar, Clock, AlertCircle, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddEditTaskViewProps {
  taskToEdit?: Task | null;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
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

export default function AddEditTaskView({ taskToEdit, onSave, onClose }: AddEditTaskViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Personal');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [estimatedDurationInput, setEstimatedDurationInput] = useState('30');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setTaskType(taskToEdit.taskType);
      setPriority(taskToEdit.priority);
      
      if (taskToEdit.deadline && taskToEdit.deadline.includes('T')) {
        const [date, time] = taskToEdit.deadline.split('T');
        setDeadlineDate(date);
        setDeadlineTime(time || '18:00');
      } else {
        setDeadlineDate(taskToEdit.deadline || '');
        setDeadlineTime(taskToEdit.suggestedCompletionTime || '18:00');
      }
      
      setEstimatedDurationInput(String(taskToEdit.estimatedDuration));
      setNotes(taskToEdit.notes || '');
    } else {
      // Set default deadline to today's date in YYYY-MM-DD format
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format safely
      setDeadlineDate(todayStr);
      setDeadlineTime('18:00'); // Standard default of 6:00 PM
    }
  }, [taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!deadlineDate) {
      newErrors.deadlineDate = 'Due date is required';
    }
    if (!deadlineTime) {
      newErrors.deadlineTime = 'Due time is required';
    }

    const trimmedDuration = estimatedDurationInput.trim();
    const isPositiveWholeNumber = /^[1-9]\d*$/.test(trimmedDuration);
    const parsedDuration = parseInt(trimmedDuration, 10);

    if (!isPositiveWholeNumber || isNaN(parsedDuration)) {
      newErrors.estimatedDuration = 'Duration must be a positive whole number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Combine date and time together as deadline
    const combinedDeadline = `${deadlineDate}T${deadlineTime}`;

    onSave({
      id: taskToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      taskType,
      priority,
      deadline: combinedDeadline,
      suggestedCompletionTime: deadlineTime,
      estimatedDuration: parsedDuration,
      notes: notes.trim() || undefined,
      status: taskToEdit?.status || 'Pending',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2F3E2E]/40 backdrop-blur-xs flex items-center justify-center p-4 z-[90] overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white rounded-3xl shadow-xl border border-black/5 w-full max-w-lg overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="bg-[#4F8A5B] text-white p-6 relative flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold tracking-tight">
              {taskToEdit ? 'Edit Task' : 'Add a New Task'}
            </h3>
            <p className="text-[#F6F8F2]/80 text-xs mt-1">
              {taskToEdit ? 'Adjust details to align with your targets' : 'Define your task and schedule'}
            </p>
          </div>
          <button
            id="close-task-modal"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              placeholder="e.g. Read 2 chapters of Botany"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              className={`w-full bg-[#F6F8F2]/50 border ${errors.title ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-[#4F8A5B]/10 focus:ring-[#4F8A5B]/20 focus:border-[#4F8A5B]'} rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none transition-all focus:ring-4`}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
              Brief Description
            </label>
            <textarea
              id="task-desc-input"
              rows={2}
              placeholder="Detail the path to achieve this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-[#4F8A5B]/20 focus:border-[#4F8A5B]"
            />
          </div>

          {/* Task Type Grid */}
          <div>
            <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-2">
              Task Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_TYPES.map((type) => {
                const isSelected = taskType === type;
                const { icon: Icon, bg, text, border } = getTaskTypeStyles(type);
                return (
                  <button
                    id={`type-button-${type}`}
                    key={type}
                    type="button"
                    onClick={() => setTaskType(type)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left outline-none cursor-pointer ${
                      isSelected 
                        ? `${bg} ${text} ${border} ring-2 ring-[#4F8A5B]/30 font-semibold shadow-xs` 
                        : 'bg-white border-slate-100 hover:border-[#4F8A5B]/20 text-slate-600 hover:bg-[#F6F8F2]/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority & Duration Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <div className="flex bg-[#F6F8F2]/80 p-1 rounded-xl border border-[#4F8A5B]/10">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      id={`priority-button-${p}`}
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all outline-none cursor-pointer ${
                        isSelected
                          ? p === 'High' 
                            ? 'bg-red-500 text-white shadow-xs font-semibold'
                            : p === 'Medium'
                            ? 'bg-[#E9C46A] text-[#2F3E2E] shadow-xs font-semibold'
                            : 'bg-[#4F8A5B] text-white shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="task-duration-input"
                  type="text"
                  placeholder="e.g. 30"
                  value={estimatedDurationInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEstimatedDurationInput(val);
                    if (/^[1-9]\d*$/.test(val.trim()) && errors.estimatedDuration) {
                      setErrors(prev => ({ ...prev, estimatedDuration: '' }));
                    }
                  }}
                  className={`w-full bg-[#F6F8F2]/50 border ${errors.estimatedDuration ? 'border-red-300 focus:ring-red-500/20' : 'border-[#4F8A5B]/10 focus:border-[#4F8A5B]'} rounded-xl pl-9 pr-14 py-2 text-sm text-[#2F3E2E] outline-none transition-all focus:ring-4 focus:ring-[#4F8A5B]/20`}
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium select-none">
                  min
                </span>
              </div>
              
              {/* Display the selected value as minutes */}
              {/^[1-9]\d*$/.test(estimatedDurationInput.trim()) && (
                <div className="text-[11px] text-[#4F8A5B] font-medium mt-1">
                  Selected: {estimatedDurationInput.trim()} minutes
                </div>
              )}

              {/* Quick-select chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '15 min', value: '15' },
                  { label: '30 min', value: '30' },
                  { label: '45 min', value: '45' },
                  { label: '1 hr', value: '60' },
                  { label: '2 hrs', value: '120' }
                ].map((chip) => {
                  const isSelected = estimatedDurationInput.trim() === chip.value;
                  return (
                    <button
                      id={`duration-chip-${chip.value}`}
                      key={chip.value}
                      type="button"
                      onClick={() => {
                        setEstimatedDurationInput(chip.value);
                        if (errors.estimatedDuration) {
                          setErrors(prev => ({ ...prev, estimatedDuration: '' }));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer outline-none border ${
                        isSelected
                          ? 'bg-[#4F8A5B] text-white border-[#4F8A5B] shadow-xs'
                          : 'bg-[#F6F8F2]/80 hover:bg-[#eaf0e4] text-[#2F3E2E] border-[#4F8A5B]/10 hover:border-[#4F8A5B]/20'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {errors.estimatedDuration && (
                <p className="text-xs text-red-600 mt-1">{errors.estimatedDuration}</p>
              )}
            </div>
          </div>

          {/* Deadline Date and Time Picker Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="task-deadline-date-input"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => {
                    setDeadlineDate(e.target.value);
                    if (errors.deadlineDate) setErrors(prev => ({ ...prev, deadlineDate: '' }));
                  }}
                  className={`w-full bg-[#F6F8F2]/50 border ${errors.deadlineDate ? 'border-red-300 focus:ring-red-500/20' : 'border-[#4F8A5B]/10 focus:border-[#4F8A5B]'} rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2F3E2E] outline-none transition-all focus:ring-4 focus:ring-[#4F8A5B]/20`}
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              {errors.deadlineDate && (
                <p className="text-xs text-red-600 mt-1">{errors.deadlineDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
                Due Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="task-deadline-time-input"
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => {
                    setDeadlineTime(e.target.value);
                    if (errors.deadlineTime) setErrors(prev => ({ ...prev, deadlineTime: '' }));
                  }}
                  className={`w-full bg-[#F6F8F2]/50 border ${errors.deadlineTime ? 'border-red-300 focus:ring-red-500/20' : 'border-[#4F8A5B]/10 focus:border-[#4F8A5B]'} rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2F3E2E] outline-none transition-all focus:ring-4 focus:ring-[#4F8A5B]/20`}
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              {errors.deadlineTime && (
                <p className="text-xs text-red-600 mt-1">{errors.deadlineTime}</p>
              )}
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
              Notes or Task Details (optional)
            </label>
            <input
              id="task-notes-input"
              type="text"
              placeholder="e.g. Put phone in another room while studying"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-2.5 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none transition-all focus:ring-4 focus:ring-[#4F8A5B]/20 focus:border-[#4F8A5B]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              id="cancel-task-button"
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] font-medium py-3 rounded-xl text-sm transition-colors cursor-pointer outline-none text-center"
            >
              Cancel
            </button>
            <button
              id="submit-task-button"
              type="submit"
              className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-[#4F8A5B]/20 transition-all hover:-translate-y-0.5 cursor-pointer outline-none flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {taskToEdit ? 'Apply Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

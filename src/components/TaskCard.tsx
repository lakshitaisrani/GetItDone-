/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, TaskType, TaskPriority } from '../types';
import { 
  Book, 
  FileText, 
  CreditCard, 
  Dumbbell, 
  BookOpen, 
  Users, 
  ShoppingBag, 
  User, 
  CheckCircle2, 
  Clock,
  Calendar,
  Edit2,
  Trash2,
  Check,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAutoVerificationMethod } from './TaskVerificationView';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  isHighlighted?: boolean;
  key?: React.Key;
}

export const getTaskTypeEmoji = (type: TaskType): string => {
  switch (type) {
    case 'Study':
      return '📚';
    case 'Assignment':
      return '📝';
    case 'Bills':
      return '💵';
    case 'Workout':
      return '🏋️';
    case 'Reading':
      return '📖';
    case 'Meeting':
      return '👥';
    case 'Shopping':
      return '🛍️';
    case 'Personal':
      return '👤';
    default:
      return '📋';
  }
};

export const getTaskTypeStyles = (type: TaskType) => {
  switch (type) {
    case 'Study':
      return { icon: Book, bg: 'bg-[#EAF2EC]', text: 'text-[#3E6B48]', border: 'border-[#3E6B48]/10' };
    case 'Assignment':
      return { icon: FileText, bg: 'bg-[#E6F3FF]', text: 'text-[#1E6B9E]', border: 'border-[#1E6B9E]/10' };
    case 'Bills':
      return { icon: CreditCard, bg: 'bg-[#FFF2E6]', text: 'text-[#B8621D]', border: 'border-[#B8621D]/10' };
    case 'Workout':
      return { icon: Dumbbell, bg: 'bg-[#F2E6FF]', text: 'text-[#7D3CB5]', border: 'border-[#7D3CB5]/10' };
    case 'Reading':
      return { icon: BookOpen, bg: 'bg-[#F5FBEA]', text: 'text-[#7C9A31]', border: 'border-[#7C9A31]/10' };
    case 'Meeting':
      return { icon: Users, bg: 'bg-[#E6FFF2]', text: 'text-[#199E5C]', border: 'border-[#199E5C]/10' };
    case 'Shopping':
      return { icon: ShoppingBag, bg: 'bg-[#FFE6EC]', text: 'text-[#B81D4F]', border: 'border-[#B81D4F]/10' };
    case 'Personal':
      return { icon: User, bg: 'bg-[#F0F2EE]', text: 'text-[#4A5D4E]', border: 'border-[#4A5D4E]/10' };
    default:
      return { icon: CheckCircle2, bg: 'bg-[#F7F8F5]', text: 'text-[#5C6E5E]', border: 'border-[#5C6E5E]/10' };
  }
};

export const getPriorityBadgeStyles = (priority: TaskPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-red-50 text-red-700 border border-red-200/50';
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    case 'Low':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100/50';
  }
};

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete, onToggleSubtask, onAddSubtask, onDeleteSubtask, isHighlighted }: TaskCardProps) {
  const { bg, border } = getTaskTypeStyles(task.taskType);
  const isCompleted = task.status === 'Completed';
  const [showDetails, setShowDetails] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');

  // Helper to format time strings (like "18:00") to "6:00 PM"
  const formatTimeToAMPM = (timeStr: string) => {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute < 10 ? `0${minute}` : minute;
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  // Formatter for deadline
  const formatDeadline = (deadlineStr: string) => {
    const dateOnly = deadlineStr.includes('T') ? deadlineStr.split('T')[0] : deadlineStr;
    const today = new Date().toLocaleDateString('en-CA');
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toLocaleDateString('en-CA');

    if (dateOnly === today) return 'Today';
    if (dateOnly === tomorrow) return 'Tomorrow';
    
    try {
      const date = new Date(dateOnly + 'T12:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateOnly;
    }
  };

  const getDueDateDisplay = (deadlineStr: string, time?: string) => {
    let datePart = deadlineStr;
    let timePart = time || '';

    if (deadlineStr && deadlineStr.includes('T')) {
      const parts = deadlineStr.split('T');
      datePart = parts[0];
      timePart = parts[1] || timePart;
    }

    const formattedDate = formatDeadline(datePart);
    const formattedTime = timePart ? formatTimeToAMPM(timePart) : '';

    if (formattedTime) {
      return `${formattedDate} • ${formattedTime}`;
    }
    return `Due: ${formattedDate}`;
  };

  const methodStr = task.verificationMethod || getAutoVerificationMethod(task.taskType, task.title);
  const hasVerification = methodStr !== 'No Verification';

  const getVerificationStatusLabel = (method: string) => {
    if (method === 'No Verification') return 'No Verification Required';
    if (method === 'AI Knowledge Check') return 'Knowledge Check Required';
    if (method === 'Short Reflection') return 'Reflection Required';
    return `${method} Required`;
  };

  // Calculate subtask completion progress
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <motion.div
      layout
      id={`task-card-${task.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -2, shadow: "0 10px 25px -5px rgba(79, 138, 91, 0.08)" }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`group relative bg-white rounded-3xl border ${isCompleted ? 'border-[#4F8A5B]/15 bg-[#F6F8F2]/20 opacity-90' : 'border-black/5'} ${isHighlighted ? 'border-[#4F8A5B] bg-[#F6F8F2]/45 ring-4 ring-[#4F8A5B]/15 shadow-lg' : 'hover:border-[#4F8A5B]/25'} p-5 transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        {/* Left Side Icon (with custom task type background) */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl select-none shrink-0 ${bg} ${border} border`}>
          {getTaskTypeEmoji(task.taskType)}
        </div>

        {/* Contents */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${getPriorityBadgeStyles(task.priority)}`}>
              {task.priority} Priority
            </span>
            <span className={`inline-flex items-center text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${
              hasVerification 
                ? 'bg-amber-50 text-amber-700 border border-amber-200/50' 
                : 'bg-slate-50 text-slate-500 border border-slate-200/50'
            }`}>
              {getVerificationStatusLabel(methodStr)}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                Completed
              </span>
            )}
          </div>

          <h4 className={`text-base font-bold tracking-tight leading-tight ${isCompleted ? 'line-through text-slate-400 font-medium' : 'text-[#2F3E2E]'}`}>
            {task.title}
          </h4>

          {/* Due date and estimated duration */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {getDueDateDisplay(task.deadline, task.suggestedCompletionTime)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {task.estimatedDuration >= 60 
                ? `${Math.floor(task.estimatedDuration / 60)}h${task.estimatedDuration % 60 > 0 ? ` ${task.estimatedDuration % 60}m` : ''}` 
                : `${task.estimatedDuration}m`
              }
            </span>
          </div>

          {task.description && (
            <p className={`text-xs mt-2 mb-1 leading-relaxed ${isCompleted ? 'text-slate-400/70' : 'text-slate-500'}`}>
              {task.description}
            </p>
          )}

          {/* PROGRESS BAR FOR SUBTASKS */}
          {hasSubtasks && (
            <div className="mt-3.5 pt-3 border-t border-slate-50 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Subtask Progress</span>
                <span>{completedSubtasks}/{totalSubtasks} ({subtasksPercent}%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-black/5">
                <div 
                  className="h-full bg-[#A7C957] rounded-full transition-all duration-300"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* VIEW DETAILS SECTION - TOGGLED ON CLICK */}
          {showDetails && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-slate-100 space-y-3"
            >
              {/* Plan Explanation */}
              {!isCompleted && task.planExplanation && (
                <p className="text-[11px] leading-relaxed text-[#4F8A5B] bg-[#F6F8F2]/60 p-2.5 rounded-xl border border-[#4F8A5B]/10 italic">
                  ✨ {task.planExplanation}
                </p>
              )}

              {/* Checklist */}
              {!isCompleted && (
                <div className="space-y-2 pt-1 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtasks</span>
                    {hasSubtasks && (
                      <span className="text-[9px] text-[#4F8A5B] font-bold bg-[#EAF2EC] px-2 py-0.5 rounded-full">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    )}
                  </div>
                  
                  {hasSubtasks && (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {task.subtasks?.map(sub => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600 hover:text-[#2F3E2E] transition-colors group"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleSubtask && onToggleSubtask(task.id, sub.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                sub.completed 
                                  ? 'bg-[#A7C957] border-[#A7C957] text-white' 
                                  : 'border-slate-300 bg-white text-transparent hover:border-[#A7C957]'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                            <span className={`truncate ${sub.completed ? 'line-through text-slate-400' : ''}`}>
                              {sub.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteSubtask && onDeleteSubtask(task.id, sub.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer animate-none"
                            title="Delete Subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add a focus step..."
                      value={newSubTitle}
                      onChange={(e) => setNewSubTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newSubTitle.trim() && onAddSubtask) {
                            onAddSubtask(task.id, newSubTitle.trim());
                            setNewSubTitle('');
                          }
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs outline-none focus:bg-white focus:border-[#4F8A5B]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSubTitle.trim() && onAddSubtask) {
                          onAddSubtask(task.id, newSubTitle.trim());
                          setNewSubTitle('');
                        }
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 animate-none"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" /> Add
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Notes */}
              {task.notes && (
                <div className="text-xs text-slate-400 border-l-2 border-[#A7C957]/30 pl-2 italic">
                  Notes: {task.notes}
                </div>
              )}
            </motion.div>
          )}

          {/* Action buttons (hidden for completed tasks) */}
          {!isCompleted && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="bg-slate-50 hover:bg-slate-100 text-[#2F3E2E] font-bold text-[11px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                {showDetails ? 'Hide Details' : 'Details'}
              </button>
              
              <button
                id={`verify-completion-btn-${task.id}`}
                onClick={() => onToggleComplete(task.id)}
                className="bg-[#4F8A5B] hover:bg-[#3E6B48] text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1 ml-auto"
              >
                <span>{hasVerification ? 'Verify' : 'Mark Complete'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Hover Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-5 top-5 bg-white/90 backdrop-blur-xs pl-2 rounded-lg z-10">
          <button
            id={`edit-task-${task.id}`}
            onClick={() => onEdit(task)}
            className="p-1.5 hover:bg-[#F6F8F2] hover:text-[#4F8A5B] rounded-lg transition-colors text-slate-400 cursor-pointer"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            id={`delete-task-${task.id}`}
            onClick={() => onDelete(task.id)}
            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-slate-400 cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

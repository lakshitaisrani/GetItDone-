/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task, Subtask, Reminder, TaskPriority, TaskType } from '../types';
import { Sparkles, Bot, Check, Plus, Trash2, Calendar, Clock, AlertCircle, Edit2, ShieldCheck, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAutoVerificationMethod } from './TaskVerificationView';

// Helper to determine if a task represents a large or complex project
export function isLargeOrComplexProject(title: string, description: string = '', taskType?: string): boolean {
  const cleanTitle = title.toLowerCase();
  const cleanDesc = (description || '').toLowerCase();
  const keywords = [
    'project', 'assignment', 'research', 'thesis', 'software', 'develop', 'build',
    'coding', 'event', 'plan', 'wedding', 'hackathon', 'organize', 'essay',
    'report', 'presentation', 'syllabus', 'course', 'curriculum', 'proposal', 'analysis'
  ];
  const matchesKeyword = keywords.some(keyword => cleanTitle.includes(keyword) || cleanDesc.includes(keyword));
  const isAssignmentType = taskType === 'Assignment';
  return matchesKeyword || isAssignmentType;
}

interface AstraPlanningViewProps {
  taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string };
  onSave: (finalTask: Task) => void;
  onClose: () => void;
  userName: string;
}

export default function AstraPlanningView({ taskData, onSave, onClose, userName }: AstraPlanningViewProps) {
  const isComplex = isLargeOrComplexProject(taskData.title, taskData.description || '', taskData.taskType);

  const [step, setStep] = useState<'ask_subtasks' | 'generating' | 'review'>(
    isComplex ? 'ask_subtasks' : 'generating'
  );
  const [generateSubtasksChoice, setGenerateSubtasksChoice] = useState<boolean | null>(
    isComplex ? null : false
  );
  const [didGenerateSubtasks, setDidGenerateSubtasks] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);

  // States representing the AI Planning Summary fields (which are fully editable)
  const [estimatedDuration, setEstimatedDuration] = useState<number>(taskData.estimatedDuration || 30);
  const [recommendedSchedule, setRecommendedSchedule] = useState<string>('');
  const [suggestedCompletionTime, setSuggestedCompletionTime] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [difficulty, setDifficulty] = useState<TaskPriority>(taskData.priority || 'Medium');
  const [verificationMethod, setVerificationMethod] = useState<string>('');
  const [planExplanation, setPlanExplanation] = useState<string>('');
  const [whySuggested, setWhySuggested] = useState<string>('');
  
  // Custom subtask creation/editing inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState<string>('');
  const [error, setError] = useState('');

  // Fetch AI Planning Summary when choice is made
  useEffect(() => {
    if (generateSubtasksChoice === null) return;

    let active = true;
    const fetchPlanSummary = async () => {
      setStep('generating');
      setDidGenerateSubtasks(generateSubtasksChoice);
      try {
        const res = await fetch('/api/task/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            task: taskData,
            generateSubtasks: generateSubtasksChoice 
          }),
        });
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        
        if (active) {
          setSubtasks(data.subtasks || []);
          setEstimatedDuration(data.estimatedDuration || taskData.estimatedDuration || 30);
          setRecommendedSchedule(data.recommendedSchedule || 'Today during an optimal hour');
          setSuggestedCompletionTime(data.suggestedCompletionTime || 'Today by the end of focus block');
          setDifficulty((data.priority as TaskPriority) || taskData.priority || 'Medium');
          setVerificationMethod(data.verificationMethod || getAutoVerificationMethod(taskData.taskType, taskData.title));
          setPlanExplanation(data.planExplanation || "We deconstructed this to organize your work without overwhelm.");
          setWhySuggested(data.whySuggested || "Why I suggested this: This schedule balances your current load with the task's complexity.");
          setStep('review');
        }
      } catch (err) {
        console.error('Failed to generate focus plan summary, using fallback', err);
        if (active) {
          // Robust programmatic fallback
          setSubtasks(generateSubtasksChoice ? [
            { id: `s-1-${Date.now()}`, title: `Review initial requirements for "${taskData.title}"`, completed: false },
            { id: `s-2-${Date.now()}`, title: `Execute core work for "${taskData.title}"`, completed: false },
            { id: `s-3-${Date.now()}`, title: 'Perform final quality checks and verification', completed: false },
          ] : []);
          setEstimatedDuration(taskData.estimatedDuration || 30);
          setRecommendedSchedule('Today at an optimal block');
          setSuggestedCompletionTime('Today 45 minutes after start');
          setDifficulty(taskData.priority || 'Medium');
          setVerificationMethod(getAutoVerificationMethod(taskData.taskType, taskData.title));
          setPlanExplanation("Let's proceed steadily. Take this one milestone at a time.");
          setWhySuggested(`Why I suggested this: This structured approach protects your schedule and ensures you hit your milestone successfully.`);
          setStep('review');
        }
      }
    };

    fetchPlanSummary();
    return () => { active = false; };
  }, [taskData, generateSubtasksChoice]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `s-custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks(prev => [...prev, newSub]);
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    if (editingSubtaskId === id) {
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleStartEditSubtask = (id: string, title: string) => {
    setEditingSubtaskId(id);
    setEditingSubtaskTitle(title);
  };

  const handleSaveSubtaskEdit = (id: string) => {
    if (!editingSubtaskTitle.trim()) return;
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, title: editingSubtaskTitle.trim() } : s));
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleFinalSave = () => {
    if (!estimatedDuration || estimatedDuration <= 0) {
      setError('Please provide a valid estimated duration.');
      return;
    }

    const finalTask: Task = {
      id: taskData.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: taskData.title,
      description: taskData.description || '',
      taskType: taskData.taskType,
      priority: difficulty,
      deadline: taskData.deadline,
      estimatedDuration: estimatedDuration,
      notes: taskData.notes || '',
      status: taskData.status || 'Pending',
      createdAt: new Date().toISOString(),
      subtasks,
      planExplanation,
      recommendedSchedule,
      suggestedCompletionTime,
      whySuggested,
      verificationMethod,
    };
    
    onSave(finalTask);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2F3E2E]/50 backdrop-blur-xs flex items-center justify-center p-4 z-[90] overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white rounded-[32px] shadow-2xl border border-black/5 w-full max-w-xl overflow-hidden flex flex-col my-8"
      >
        {/* Banner header */}
        <div className="bg-[#4F8A5B] text-white p-6 relative">
          <div className="absolute right-6 top-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#A7C957]" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-black text-[#A7C957]">Astra Planning Assistant</span>
          <h3 className="text-xl font-serif font-bold mt-1">Planning: {taskData.title}</h3>
          <p className="text-white/80 text-xs mt-1">Optimizing your task workflow and milestones</p>
        </div>

        {/* Dynamic Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* STEP 0: ASK FOR SUBTASK GENERATION (Complex projects only) */}
          {step === 'ask_subtasks' && (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative flex items-center justify-center">
                {/* Glowing decorative rings */}
                <div className="absolute w-20 h-20 bg-[#4F8A5B]/5 rounded-full animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-[#EAF2EC] flex items-center justify-center relative z-10 shadow-xs border border-[#4F8A5B]/10">
                  <Sparkles className="w-7 h-7 text-[#4F8A5B]" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-sm">
                <p className="font-serif font-bold text-lg text-[#2F3E2E]">
                  This looks like a larger task.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Would you like Astra to automatically break down <strong className="text-[#2F3E2E]">"{taskData.title}"</strong> into smaller, actionable steps to make execution easier?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
                <button
                  type="button"
                  onClick={() => setGenerateSubtasksChoice(true)}
                  className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Yes, break it down
                </button>
                <button
                  type="button"
                  onClick={() => setGenerateSubtasksChoice(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-[#2F3E2E] border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  No, manage manually
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: GENERATING LOADER */}
          {step === 'generating' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative flex items-center justify-center">
                {/* Glowing decorative rings */}
                <div className="absolute w-20 h-20 bg-[#4F8A5B]/5 rounded-full animate-ping duration-1000" />
                <div className="absolute w-24 h-24 bg-[#A7C957]/5 rounded-full animate-pulse duration-2000" />
                
                {/* Custom glowing spinner */}
                <div className="w-16 h-16 rounded-full border-4 border-[#F6F8F2] border-t-[#4F8A5B] animate-spin relative z-10 shadow-sm" />
                <div className="absolute z-20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-[#4F8A5B] animate-pulse" />
                </div>
              </div>
              <div className="space-y-1 relative z-10">
                <p className="font-serif font-bold text-lg text-[#2F3E2E]">Astra is crafting your focus roadmap...</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Analyzing task complexity, mapping micro-milestones, and structuring an optimal verification journey.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW / EDIT SUMMARY */}
          {step === 'review' && (
            <div className="space-y-6">
              
              {/* Main AI Summary Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#2F3E2E] uppercase tracking-wider">AI Planning Summary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Task Name */}
                  <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Task Name</span>
                    <p className="text-sm font-bold text-[#2F3E2E] mt-0.5">{taskData.title}</p>
                  </div>

                  {/* Estimated Duration */}
                  <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#4F8A5B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Estimated Duration</span>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="number"
                              min="1"
                              value={estimatedDuration}
                              onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 0)}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-[#2F3E2E] outline-none"
                            />
                            <span className="text-xs text-slate-500 font-semibold">min</span>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-[#2F3E2E] mt-0.5">{estimatedDuration} Minutes</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estimated Difficulty */}
                  <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5">
                    <div className="flex items-start gap-3">
                      <BarChart2 className="w-4 h-4 text-[#4F8A5B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Estimated Difficulty</span>
                        {isEditing ? (
                          <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as TaskPriority)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 mt-1 text-xs text-[#2F3E2E] outline-none animate-none"
                          >
                            <option value="Low">Low Difficulty</option>
                            <option value="Medium">Medium Difficulty</option>
                            <option value="High">High Difficulty</option>
                          </select>
                        ) : (
                          <div className="mt-1">
                            <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              difficulty === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                              difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {difficulty} Difficulty
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggested Start Time */}
                  <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-[#4F8A5B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Suggested Start Time</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={recommendedSchedule}
                            onChange={(e) => setRecommendedSchedule(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 mt-1 text-xs text-[#2F3E2E] outline-none"
                          />
                        ) : (
                          <p className="text-sm font-bold text-[#2F3E2E] mt-0.5 truncate">{recommendedSchedule}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggested Verification Method */}
                  <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#4F8A5B] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Suggested Verification</span>
                        {isEditing ? (
                          <select
                            value={verificationMethod}
                            onChange={(e) => setVerificationMethod(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 mt-1 text-xs text-[#2F3E2E] outline-none animate-none"
                          >
                            <option value="AI Knowledge Check">AI Knowledge Check</option>
                            <option value="Screenshot">Screenshot</option>
                            <option value="Document">Document</option>
                            <option value="Image">Image</option>
                            <option value="No Verification">No Verification</option>
                            <option value="Short Reflection">Short Reflection</option>
                          </select>
                        ) : (
                          <p className="text-sm font-bold text-[#2F3E2E] mt-0.5 truncate">{verificationMethod}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Subtasks checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                    {didGenerateSubtasks ? "AI Generated Subtasks" : "Subtasks (Optional)"}
                  </h4>
                  {subtasks.length > 0 && (
                    <span className="text-[10px] text-[#4F8A5B] font-bold bg-[#EAF2EC] px-2 py-0.5 rounded-full">
                      {subtasks.length} items
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2.5 bg-[#F6F8F2]/30 border border-slate-100 rounded-xl p-3 hover:border-[#4F8A5B]/10 transition-colors">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(sub.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          sub.completed 
                            ? 'bg-[#4F8A5B] border-[#4F8A5B] text-white' 
                            : 'border-[#4F8A5B]/20 bg-white text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      
                      {editingSubtaskId === sub.id ? (
                        <div className="flex-1 flex gap-1 items-center">
                          <input
                            type="text"
                            value={editingSubtaskTitle}
                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveSubtaskEdit(sub.id);
                              } else if (e.key === 'Escape') {
                                handleCancelSubtaskEdit();
                              }
                            }}
                            className="flex-1 text-xs bg-white border border-[#4F8A5B]/30 rounded-md px-2 py-1 outline-none text-[#2F3E2E] focus:border-[#4F8A5B]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSubtaskEdit(sub.id)}
                            className="text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelSubtaskEdit}
                            className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {isEditing ? (
                            <input
                              type="text"
                              value={sub.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, title: val } : s));
                              }}
                              className="flex-1 text-xs bg-white border border-slate-100 rounded-md px-2 py-1 outline-none text-[#2F3E2E]"
                            />
                          ) : (
                            <span className={`flex-1 text-xs text-[#2F3E2E] ${sub.completed ? 'line-through opacity-50' : ''}`}>
                              {sub.title}
                            </span>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => handleStartEditSubtask(sub.id, sub.title)}
                                className="text-slate-400 hover:text-[#4F8A5B] transition-colors p-1 rounded hover:bg-slate-50"
                                title="Edit subtask"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(sub.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {subtasks.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4 italic">
                      {didGenerateSubtasks ? "No subtasks generated." : "No subtasks added yet. Create one below if you wish!"}
                    </p>
                  )}
                </div>

                {/* Add Custom Subtask Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a custom focus step..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                    className="flex-1 bg-[#F6F8F2]/40 border border-[#4F8A5B]/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-[#4F8A5B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="bg-[#4F8A5B]/10 hover:bg-[#4F8A5B]/20 text-[#4F8A5B] p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center font-sans font-bold text-xs"
                    title="Add Subtask"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Rationale Bottom Line */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 italic font-medium">
                  Plan generated based on your deadline and estimated effort.
                </p>
              </div>

              {error && (
                <div className="text-[10px] text-red-500 font-semibold bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Cancel Edits
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setError('');
                      }}
                      className="flex-1 bg-[#4F8A5B] text-white hover:bg-[#3E6B48] py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Apply Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Plan
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSave}
                      className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Accept Plan
                    </button>
                  </>
                )}
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}

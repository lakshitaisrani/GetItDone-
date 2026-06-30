/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Task, Idea, TaskType, TaskPriority, Subtask } from '../types';
import { 
  Sparkles, 
  Bot, 
  Check, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  X, 
  Edit2, 
  Mail, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Rotational placeholders to inspire quick thought-dumping
const PLACEHOLDERS = [
  "Need to revise Operating Systems...",
  "Buy a birthday gift for dad...",
  "Remember to email the professor about the grade...",
  "Water the office plants this evening...",
  "Draft the biology lab project outline...",
  "Check the electricity bill conservation program...",
  "Pick up groceries for dinner..."
];

interface IdeaInboxViewProps {
  ideas: Idea[];
  setIdeas: React.Dispatch<React.SetStateAction<Idea[]>>;
  onAddTask: (task: Task) => void;
  userName: string;
}

export default function IdeaInboxView({ ideas, setIdeas, onAddTask, userName }: IdeaInboxViewProps) {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInputCard, setShowInputCard] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'suggestions'>('inbox');
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);

  // States for editing a suggestion inline
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTaskType, setEditTaskType] = useState<TaskType>('Personal');
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium');
  const [editDuration, setEditDuration] = useState<number>(30);

  // Input text area reference
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholders gently
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newIdea: Idea = {
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedIdeas = [newIdea, ...ideas];
    setIdeas(updatedIdeas);
    localStorage.setItem('getitdone_ideas', JSON.stringify(updatedIdeas));
    setInputText('');
    
    // Subtle success notification
    triggerToast("✉️ Added to your Idea Inbox.");
    
    // Gentle shake/spring on the textarea if needed, or simply return focus
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteIdea = (id: string) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    setIdeas(updatedIdeas);
    localStorage.setItem('getitdone_ideas', JSON.stringify(updatedIdeas));
    triggerToast("Idea removed from inbox.");
  };

  const handleOrganizeWithAstra = async () => {
    if (ideas.length === 0) return;
    
    setIsOrganizing(true);
    setSuggestions([]);
    setActiveTab('suggestions');

    try {
      const res = await fetch('/api/astra/organize-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas, userName }),
      });

      if (!res.ok) throw new Error('Organization endpoint failed');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to organize ideas', err);
      // Fallback programmatically (similar to server fallback, built client-side)
      const mockSuggestions = ideas.map((idea, index) => {
        const textLower = idea.text.toLowerCase();
        let suggestionType = 'Task';
        let suggestedTitle = idea.text;
        let taskType: TaskType = 'Personal';
        let priority: TaskPriority = 'Medium';
        let estimatedDuration = 30;
        let subtasks = ['Organize resources', 'Execute task with quiet presence', 'Review completion'];
        let explanation = "Programmatic organization: Let's turn this thought into an action. 🌿";

        if (textLower.includes('study') || textLower.includes('exam') || textLower.includes('learn') || textLower.includes('revise') || textLower.includes('operating systems')) {
          suggestionType = 'Study Session';
          taskType = 'Study';
          suggestedTitle = idea.text.length > 40 ? `${idea.text.substring(0, 37)}...` : idea.text;
          estimatedDuration = 45;
          subtasks = ['Review lecture material 📚', 'Practice active recall', 'Draft a 1-page summary'];
          explanation = "Learning is the soil where focus sprouts. Let's grow your understanding. 🧠";
        } else if (textLower.includes('buy') || textLower.includes('shop') || textLower.includes('grocery') || textLower.includes('groceries') || textLower.includes('gift') || textLower.includes('birthday')) {
          suggestionType = 'Shopping Item';
          taskType = 'Shopping';
          suggestedTitle = idea.text.length > 40 ? `${idea.text.substring(0, 37)}...` : idea.text;
          estimatedDuration = 20;
          subtasks = ['Verify missing items 🛒', 'Locate item online or at store', 'Order or buy and check-off'];
          explanation = "Providing ourselves with nourishing items keeps our bodies resilient. 🍎";
        } else if (textLower.includes('meet') || textLower.includes('email') || textLower.includes('call') || textLower.includes('professor')) {
          suggestionType = 'Meeting';
          taskType = 'Meeting';
          suggestedTitle = idea.text.length > 40 ? `${idea.text.substring(0, 37)}...` : idea.text;
          estimatedDuration = 15;
          subtasks = ['Draft speaking points 📝', 'Send message or hold meeting', 'Verify follow-up tasks'];
          explanation = "Clear connection is like light filtering through canopy leaves. 🍃";
        } else if (textLower.includes('goal') || textLower.includes('project') || textLower.includes('finish') || textLower.includes('complete')) {
          suggestionType = 'Goal';
          taskType = 'Assignment';
          priority = 'High';
          suggestedTitle = idea.text.length > 40 ? `${idea.text.substring(0, 37)}...` : idea.text;
          estimatedDuration = 90;
          subtasks = ['Deconstruct into milestones 🎯', 'Clear workspace for deep block', 'Perform active verification'];
          explanation = "A grand redwood begins with a bold root system. Let's build towards your goals. 🌲";
        }

        return {
          id: `fallback-suggestion-${index}-${Date.now()}`,
          ideaId: idea.id,
          originalText: idea.text,
          suggestionType,
          suggestedTitle,
          suggestedDescription: `Structured from: "${idea.text}"`,
          taskType,
          priority,
          estimatedDuration,
          subtasks,
          explanation
        };
      });
      setSuggestions(mockSuggestions);
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleStartEditing = (sug: any) => {
    setEditingSuggestionId(sug.id);
    setEditTitle(sug.suggestedTitle);
    setEditDescription(sug.suggestedDescription || '');
    setEditTaskType(sug.taskType || 'Personal');
    setEditPriority(sug.priority || 'Medium');
    setEditDuration(sug.estimatedDuration || 30);
  };

  const handleSaveEdit = (sugId: string) => {
    setSuggestions(prev => prev.map(s => {
      if (s.id === sugId) {
        return {
          ...s,
          suggestedTitle: editTitle,
          suggestedDescription: editDescription,
          taskType: editTaskType,
          priority: editPriority,
          estimatedDuration: editDuration
        };
      }
      return s;
    }));
    setEditingSuggestionId(null);
    triggerToast("Suggestion updated.");
  };

  const handleApproveSuggestion = (sug: any) => {
    // 1. Create a real Task object
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: sug.suggestedTitle,
      description: sug.suggestedDescription || '',
      taskType: sug.taskType,
      priority: sug.priority,
      deadline: new Date().toLocaleDateString('en-CA'), // default to today
      estimatedDuration: sug.estimatedDuration,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      subtasks: (sug.subtasks || []).map((st: string | any, idx: number) => ({
        id: `subtask-${Date.now()}-${idx}`,
        title: typeof st === 'string' ? st : (st.title || 'Step'),
        completed: false
      })),
      whySuggested: `Why Astra suggested this: ${sug.explanation || 'Created from your Idea Inbox.'}`,
      planExplanation: `Astra converted this from your raw thought: "${sug.originalText}" 🌿`
    };

    // 2. Add to actual Task state via callback
    onAddTask(newTask);

    // 3. Remove original idea and suggestion
    const updatedIdeas = ideas.filter(idea => idea.id !== sug.ideaId);
    setIdeas(updatedIdeas);
    localStorage.setItem('getitdone_ideas', JSON.stringify(updatedIdeas));

    setSuggestions(prev => prev.filter(s => s.id !== sug.id));

    // Elegant feedback effect
    triggerToast(`✨ Realized: "${sug.suggestedTitle}" added to Tasks!`);
  };

  const handleRejectSuggestion = (sug: any) => {
    // Just remove suggestion, keep original idea or delete it?
    // Usually, reject means dismiss the suggestion for now. Let's delete the suggestion but keep the idea,
    // or give an option. Let's delete both so they clean their inbox, or simply dismiss the proposal.
    // Let's delete the suggestion and also delete the original idea from the inbox so it serves as a "clean up".
    const updatedIdeas = ideas.filter(idea => idea.id !== sug.ideaId);
    setIdeas(updatedIdeas);
    localStorage.setItem('getitdone_ideas', JSON.stringify(updatedIdeas));
    setSuggestions(prev => prev.filter(s => s.id !== sug.id));
    triggerToast("Suggestion dismissed and removed.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-20">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] bg-[#2F3E2E] text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-lg border border-white/10 flex items-center gap-2"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: The Idea Sandbox (Input and List) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Main Idea Inbox Card */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xs border border-white/50 relative overflow-hidden flex flex-col">
          {/* Envelope style top fold accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4F8A5B] via-[#A7C957] to-[#4F8A5B]" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#2F3E2E] flex items-center gap-2">
                <span>✉️</span> Idea Inbox
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Dump your ideas. Organize them later.</p>
            </div>
            
            {ideas.length > 0 && (
              <button
                onClick={handleOrganizeWithAstra}
                disabled={isOrganizing}
                className="bg-gradient-to-r from-[#4F8A5B] to-[#3E6B48] hover:from-[#3E6B48] hover:to-[#2F3E2E] disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer outline-none border-none"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A7C957] fill-current" />
                <span>✨ Organize with Astra</span>
              </button>
            )}
          </div>

          {/* Calming quick-capture text area */}
          <form onSubmit={handleSaveIdea} className="space-y-4">
            <div className="relative group">
              {/* Soft leaf/paper texture effect */}
              <div className="absolute inset-0 bg-[#F6F8F2]/20 rounded-2xl pointer-events-none -z-10 border border-[#4F8A5B]/5 transition-colors group-focus-within:bg-[#F6F8F2]/30" />
              
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveIdea(e);
                  }
                }}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                className="w-full min-h-[120px] bg-transparent p-4 text-sm text-[#2F3E2E] placeholder-slate-400/80 outline-none border-2 border-slate-100 focus:border-[#4F8A5B]/30 rounded-2xl resize-none leading-relaxed transition-all"
              />
              
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-300 font-bold hidden sm:block">
                Press Enter to add, Shift+Enter for new line
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-400 italic">
                A simple space for ideas. No tags, no pressure.
              </p>
              
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-[#4F8A5B] hover:bg-[#3E6B48] disabled:opacity-30 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer outline-none border-none flex items-center gap-1"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Idea</span>
              </button>
            </div>
          </form>

          {/* Separator lines for lists */}
          {ideas.length > 0 && <div className="h-px bg-slate-100 my-6" />}

          {/* Collected Ideas list */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {ideas.length > 0 ? (
                ideas.map((idea) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="group bg-[#F6F8F2]/35 hover:bg-[#F6F8F2]/75 border border-slate-100 rounded-2xl p-4 flex gap-4 items-start justify-between transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2F3E2E] leading-relaxed break-words whitespace-pre-wrap font-sans font-medium">
                        {idea.text}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1.5">
                        Captured {new Date(idea.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Discard raw idea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-[#F6F8F2]/25 rounded-3xl border-2 border-dashed border-[#4F8A5B]/10 p-6">
                  <span className="text-4xl mb-3">📬</span>
                  <h3 className="text-base font-serif font-bold text-[#2F3E2E]">Nothing here yet.</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                    Capture ideas, reminders or random thoughts. Astra will organize them whenever you're ready.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                    className="mt-4 bg-[#EAF2EC] text-[#4F8A5B] hover:bg-[#4F8A5B] hover:text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all border border-[#4F8A5B]/10 cursor-pointer"
                  >
                    Write Your First Idea
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Suggestions & AI Space */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Calming AI companion banner */}
        <div className="bg-[#4F8A5B] text-white rounded-[32px] p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest font-black opacity-90 bg-white/15 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-[#A7C957]" />
              Astra's Insight
            </span>

            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold leading-tight">
                Hi! I'm Astra 👋
              </h3>
              <p className="text-xs text-white/95 leading-relaxed">
                Write anything that's on your mind. When you're ready, I'll organize it into tasks, reminders, study plans or goals.
              </p>
            </div>
            
            <p className="text-xs text-white/80 leading-relaxed italic bg-black/10 p-3 rounded-2xl border border-white/5">
              "You don't have to organize everything today. Just capture it now, and I'll help you sort it out later."
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-white/75">Ideas in Inbox</span>
              <span className="text-xs font-black">{ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}</span>
            </div>
            
            {ideas.length > 0 && !isOrganizing && (
              <button
                onClick={handleOrganizeWithAstra}
                className="bg-[#A7C957] hover:bg-white text-[#2F3E2E] px-4.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer border-none"
              >
                <span>✨ Sift Ideas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions list */}
        {activeTab === 'suggestions' && (
          <div className="bg-white rounded-[32px] p-6 shadow-xs border border-white/50 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div>
                <h3 className="text-base font-serif font-bold text-[#2F3E2E] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#A7C957] fill-current" />
                  Astra Proposals
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Approve ideas to realize them as tasks</p>
              </div>

              <button
                onClick={() => {
                  setSuggestions([]);
                  setActiveTab('inbox');
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
                title="Back to Inbox"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Loading / Processing State */}
            {isOrganizing ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="relative mb-4">
                  <div className="w-12 h-12 rounded-full border-4 border-[#F6F8F2] border-t-[#4F8A5B] animate-spin" />
                  <Bot className="w-5 h-5 text-[#4F8A5B] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h4 className="text-xs font-black text-[#2F3E2E]">Analyzing your list of ideas...</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                  Astra is gently parsing each idea to suggest the most optimal tasks, study blocks, meetings, or reminders.
                </p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {suggestions.map((sug) => {
                  const isEditingThis = editingSuggestionId === sug.id;
                  
                  // Color codes based on suggestion type
                  let typeColor = 'bg-[#EAF2EC] text-[#4F8A5B]';
                  if (sug.suggestionType === 'Study Session') typeColor = 'bg-[#EBF5FF] text-blue-600';
                  else if (sug.suggestionType === 'Shopping Item') typeColor = 'bg-[#FFF3E0] text-amber-700';
                  else if (sug.suggestionType === 'Goal') typeColor = 'bg-[#F3E5F5] text-purple-700';
                  else if (sug.suggestionType === 'Meeting') typeColor = 'bg-[#E8F5E9] text-emerald-700';
                  else if (sug.suggestionType === 'Reminder') typeColor = 'bg-[#ECEFF1] text-slate-600';

                  return (
                    <div key={sug.id} className="bg-[#F6F8F2]/30 border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-[#4F8A5B]/15 transition-all">
                      
                      {/* Original Thought reference */}
                      <div className="text-[10px] text-slate-400 bg-[#F6F8F2] px-2.5 py-1.5 rounded-lg font-sans">
                        <span className="font-bold uppercase text-[8px] tracking-wider block text-slate-400/80 mb-0.5">Original Thought</span>
                        "{sug.originalText}"
                      </div>

                      {isEditingThis ? (
                        /* Editing inline form */
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400">Suggested Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-[#4F8A5B] mt-0.5 text-[#2F3E2E] font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400">Description</label>
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-[#4F8A5B] mt-0.5 text-[#2F3E2E]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400">Priority</label>
                              <select
                                value={editPriority}
                                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                                className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-[#4F8A5B] mt-0.5"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400">Duration (mins)</label>
                              <input
                                type="number"
                                value={editDuration}
                                onChange={(e) => setEditDuration(Number(e.target.value))}
                                className="w-full text-xs p-2 rounded-xl bg-white border border-slate-200 outline-none focus:border-[#4F8A5B] mt-0.5"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              onClick={() => setEditingSuggestionId(null)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(sug.id)}
                              className="px-3 py-1.5 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Apply Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Proposal View */
                        <>
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${typeColor}`}>
                                  {sug.suggestionType}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {sug.estimatedDuration}m
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-[#2F3E2E] leading-snug">{sug.suggestedTitle}</h4>
                              {sug.suggestedDescription && (
                                <p className="text-[11px] text-slate-500 leading-normal">{sug.suggestedDescription}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleStartEditing(sug)}
                              className="p-1.5 text-slate-400 hover:text-[#4F8A5B] rounded-lg transition-colors cursor-pointer"
                              title="Edit proposal details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Subtasks outline */}
                          {sug.subtasks && sug.subtasks.length > 0 && (
                            <div className="bg-white/40 p-2.5 rounded-xl border border-dashed border-slate-100 space-y-1.5">
                              <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Steps to complete</span>
                              <div className="space-y-1">
                                {sug.subtasks.map((sub: string, index: number) => (
                                  <div key={index} className="flex gap-2 items-center text-[10px] text-slate-500">
                                    <span className="w-1 h-1 bg-[#A7C957] rounded-full" />
                                    <span className="truncate">{sub}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Astra Explanation */}
                          <div className="text-[10px] text-[#4F8A5B] italic leading-relaxed pt-0.5">
                            "{sug.explanation}"
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => handleRejectSuggestion(sug)}
                              className="px-3.5 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-xl text-[10px] font-bold transition-all cursor-pointer border-none bg-transparent"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleApproveSuggestion(sug)}
                              className="px-4 py-2 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white rounded-xl text-[10px] font-black transition-all shadow-xs flex items-center gap-1 cursor-pointer border-none"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Approve</span>
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <span className="text-3xl mb-2">✨</span>
                <p className="text-xs font-serif font-bold text-[#2F3E2E]">All Proposals Realized</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                  Excellent! Every suggestion has been evaluated and structured into your task list.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Informational Guidelines card */}
        <div className="bg-white rounded-[32px] p-6 shadow-xs border border-white/50 space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#2F3E2E] flex items-center gap-1">
            <span>✨</span> What Astra Can Do
          </h3>
          <ul className="text-xs text-slate-500 space-y-2 list-none p-0 m-0">
            <li className="flex items-start gap-2">
              <span className="text-[#4F8A5B] font-bold">•</span>
              <span>Turn ideas into tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4F8A5B] font-bold">•</span>
              <span>Suggest deadlines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4F8A5B] font-bold">•</span>
              <span>Break large projects into smaller steps</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4F8A5B] font-bold">•</span>
              <span>Group similar ideas together</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4F8A5B] font-bold">•</span>
              <span>Help plan your day</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}

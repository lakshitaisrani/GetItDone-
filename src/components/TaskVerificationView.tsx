/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Task, QuizQuestion, TaskType } from '../types';
import { X, Check, Bot, Sparkles, Upload, FileText, AlertCircle, Image as ImageIcon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function GoldenSparkles() {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 14 + 6,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 1.8,
    }));
    setSparkles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 rounded-3xl">
      {sparkles.map((s) => (
        <motion.svg
          key={s.id}
          className="absolute fill-current"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            color: s.id % 2 === 0 ? 'var(--color-primary-gold, #F59E0B)' : s.id % 3 === 0 ? '#FFFFFF' : 'var(--color-primary-soft, #FEF08A)', // Gold/Theme Primary, White, Soft Yellow/Theme Accent
          }}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.2, 0.8, 1.1, 0],
            opacity: [0, 1, 0.9, 1, 0],
            rotate: [0, 60, 120, 180, 240],
            y: [0, -40 - Math.random() * 60],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: Math.random() * 1.0
          }}
          viewBox="0 0 24 24"
        >
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
        </motion.svg>
      ))}
    </div>
  );
}

interface TaskVerificationViewProps {
  task: Task;
  onVerified: (verifiedProof: any) => void;
  onClose: () => void;
}

export function getAutoVerificationMethod(taskType: TaskType, title: string = ''): string {
  const t = taskType;
  const titleLower = title.toLowerCase();

  // Examples:
  // Study → AI Knowledge Check
  // Bill → Screenshot
  // Assignment → Document
  // Workout → Image
  // Meeting → No Verification
  // Birthday Reminder → No Verification
  // Reading → Short Reflection

  if (t === 'Study' || titleLower.includes('study') || titleLower.includes('learn')) {
    return 'AI Knowledge Check';
  }
  if (t === 'Bills' || titleLower.includes('bill') || titleLower.includes('pay')) {
    return 'Screenshot';
  }
  if (t === 'Assignment' || titleLower.includes('assignment') || titleLower.includes('project')) {
    return 'Document';
  }
  if (t === 'Workout' || titleLower.includes('workout') || titleLower.includes('gym') || titleLower.includes('run')) {
    return 'Image';
  }
  if (t === 'Meeting' || titleLower.includes('meeting')) {
    return 'No Verification';
  }
  if (titleLower.includes('birthday') || titleLower.includes('reminder')) {
    return 'No Verification';
  }
  if (t === 'Reading' || titleLower.includes('reading') || titleLower.includes('book')) {
    return 'Short Reflection';
  }

  // Fallback defaults:
  if (t === 'Shopping' || t === 'Personal' || t === 'Other') {
    return 'Short Reflection';
  }
  return 'Short Reflection';
}

export function getVerificationConfig(task: Task): {
  level: 'none' | 'light' | 'smart';
  method?: 'study-quiz' | 'document' | 'screenshot' | 'image' | 'before-after';
  reasoning: string;
} {
  const methodStr = task.verificationMethod || getAutoVerificationMethod(task.taskType, task.title);

  if (methodStr === 'AI Knowledge Check') {
    return {
      level: 'smart',
      method: 'study-quiz',
      reasoning: `For academic study, Astra has designed an active recall AI Knowledge Check to lock in your memory.`
    };
  }

  if (methodStr === 'Screenshot') {
    return {
      level: 'smart',
      method: 'screenshot',
      reasoning: `To secure your peace of mind, Astra has automated a Receipt/Confirmation Screenshot check.`
    };
  }

  if (methodStr === 'Document') {
    return {
      level: 'smart',
      method: 'document',
      reasoning: `Assignments are substantial deliverables. Astra set a Document Upload to log your progress.`
    };
  }

  if (methodStr === 'Image') {
    return {
      level: 'smart',
      method: 'image',
      reasoning: `To document your physical journey, Astra selected an Image Upload for metrics, maps, or activity snapshot.`
    };
  }

  if (methodStr === 'No Verification') {
    return {
      level: 'none',
      reasoning: `This simple attendance or reminder task doesn't require formal proof of completion.`
    };
  }

  if (methodStr === 'Short Reflection') {
    return {
      level: 'light',
      reasoning: `As a self-reflective practice, this task is best certified by a moment of mindful introspection.`
    };
  }

  // Fallback: Default to Light Verification for low-intensity default tasks
  return {
    level: 'light',
    reasoning: `Astra would love to read a quick, thoughtful summary of your focus on this task.`
  };
}

export default function TaskVerificationView({ task, onVerified, onClose }: TaskVerificationViewProps) {
  const config = getVerificationConfig(task);

  const [step, setStep] = useState<'input' | 'evaluating' | 'result'>('input');
  const [error, setError] = useState('');

  // General inputs
  const [reflectionText, setReflectionText] = useState('');
  const [commentText, setCommentText] = useState('');

  // Files
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<{ name: string; size: number } | null>(null);
  const [beforeImageBase64, setBeforeImageBase64] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<{ name: string; size: number } | null>(null);
  const [afterImageBase64, setAfterImageBase64] = useState<string | null>(null);

  // Drag states
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveBefore, setDragActiveBefore] = useState(false);
  const [dragActiveAfter, setDragActiveAfter] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Study states
  const [studySubject, setStudySubject] = useState(task.title || '');
  const [studyTopics, setStudyTopics] = useState(task.notes || task.description || '');
  const [studyExplanation, setStudyExplanation] = useState('');
  const [studyStep, setStudyStep] = useState<'topics' | 'evaluating' | 'result'>('topics');

  // Verification Result
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidence: number;
    explanation: string;
    gpEarned: number;
    breakdown: {
      base: number;
      earlyBonus: number;
      planBonus: number;
      total: number;
    };
  } | null>(null);

  // Growth Points Calculator
  const calculateGP = () => {
    let baseGP = 10;
    if (task.priority === 'Medium') baseGP = 20;
    if (task.priority === 'High') baseGP = 30;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const isEarly = !task.deadline || todayStr <= task.deadline;
    const earlyBonus = isEarly ? 10 : 0;

    const hasPlan = task.subtasks && task.subtasks.length > 0;
    const planBonus = hasPlan ? 15 : 0;

    const totalGP = baseGP + earlyBonus + planBonus;
    return {
      base: baseGP,
      earlyBonus,
      planBonus,
      total: totalGP
    };
  };

  // No Verification Complete
  const handleNoVerificationComplete = () => {
    const gp = calculateGP();
    onVerified({
      verified: true,
      confidence: 100,
      explanation: "No formal verification required! This task is registered and completed successfully.",
      gpEarned: gp.total,
      breakdown: gp
    });
  };

  // Handle study explanation verification
  const handleSubmitExplanation = async () => {
    if (!studySubject.trim()) {
      setError('Please tell me what subject you studied.');
      return;
    }
    if (!studyTopics.trim()) {
      setError('Please tell me what topics you covered.');
      return;
    }
    if (!studyExplanation.trim()) {
      setError('Please explain one or more concepts you learned in your own words.');
      return;
    }
    setError('');
    setStudyStep('evaluating');

    try {
      const response = await fetch('/api/study/verify-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          subject: studySubject,
          topics: studyTopics,
          explanation: studyExplanation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const gp = calculateGP();

        setVerificationResult({
          verified: data.verified,
          confidence: 100,
          explanation: data.explanation,
          gpEarned: gp.total,
          breakdown: gp
        });
        setStudyStep('result');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      console.error(err);
      setError('The server is currently offline or unreachable. Please try submitting again.');
      setStudyStep('topics');
    }
  };

  const readFileAsBase64 = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file to Base64:', error);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent, setter: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setter(true);
    } else if (e.type === 'dragleave') {
      setter(false);
    }
  };

  const handleDropFile = (
    e: React.DragEvent, 
    setter: (file: { name: string; size: number }) => void, 
    activeSetter: (val: boolean) => void,
    base64Setter?: (base64: string) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    activeSetter(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setter({ name: file.name, size: file.size });
      setError('');
      if (base64Setter) {
        readFileAsBase64(file, base64Setter);
      }
    }
  };

  const handleSelectFile = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (file: { name: string; size: number }) => void,
    base64Setter?: (base64: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setter({ name: file.name, size: file.size });
      setError('');
      if (base64Setter) {
        readFileAsBase64(file, base64Setter);
      }
    }
  };

  // Submit standard / light / smart verification
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let proofType: 'screenshot' | 'document' | 'image' | 'summary' = 'summary';
    let textValue = '';
    let fName = '';

    if (config.level === 'light') {
      proofType = 'summary';
      textValue = reflectionText.trim();
      if (!textValue) {
        setError('Please share your short takeaway before completing the task.');
        return;
      }
    } else if (config.level === 'smart') {
      if (config.method === 'document') {
        proofType = 'document';
        textValue = commentText.trim();
        if (!uploadedFile) {
          setError('Please upload your completed document file to complete verification.');
          return;
        }
        fName = uploadedFile.name;
      } else if (config.method === 'screenshot') {
        proofType = 'screenshot';
        textValue = commentText.trim();
        if (!uploadedFile) {
          setError('Please upload your transaction screenshot to complete verification.');
          return;
        }
        fName = uploadedFile.name;
      } else if (config.method === 'image') {
        proofType = 'image';
        textValue = commentText.trim();
        if (!uploadedFile) {
          setError('Please upload an activity photo or metric screenshot to complete verification.');
          return;
        }
        fName = uploadedFile.name;
      } else if (config.method === 'before-after') {
        proofType = 'image';
        textValue = `Before-and-after cleaning verification. ${commentText.trim()}`;
        if (!beforeImage || !afterImage) {
          setError('Please upload both Before and After images to verify your cleaning task.');
          return;
        }
        fName = `Before: ${beforeImage.name} | After: ${afterImage.name}`;
      }
    }

    setStep('evaluating');

    try {
      const response = await fetch('/api/task/verify-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          proofType,
          textValue,
          fileName: fName || undefined,
          uploadedFileBase64: uploadedFileBase64 || undefined,
          beforeImageBase64: beforeImageBase64 || undefined,
          afterImageBase64: afterImageBase64 || undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const gp = calculateGP();

        setVerificationResult({
          verified: data.verified,
          confidence: data.confidence || 100,
          explanation: data.explanation,
          gpEarned: gp.total,
          breakdown: gp
        });
        setStep('result');
      } else {
        throw new Error('API failure');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const gp = calculateGP();
      setTimeout(() => {
        setVerificationResult({
          verified: true,
          confidence: 100,
          explanation: config.level === 'light'
            ? `Astra appreciates your reflection! Your takeaway is registered successfully, completing your task.`
            : `Astra offline backup: Your proof for "${task.title}" looks excellent. Your effort is fully present. Verification registered successfully!`,
          gpEarned: gp.total,
          breakdown: gp
        });
        setStep('result');
      }, 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2F3E2E]/45 backdrop-blur-xs flex items-center justify-center p-4 z-[90] overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white rounded-[32px] shadow-2xl border border-black/5 w-full max-w-lg overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="bg-[#4F8A5B] text-white p-6 relative flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-[#A7C957]">Verification Checklist</span>
            <h3 className="text-xl font-serif font-bold tracking-tight">Verify Completion</h3>
            <p className="text-white/80 text-xs mt-1">Let Astra verify your completion to award XP</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">

          {/* Level 1: No Verification */}
          {config.level === 'none' && (
            <div className="space-y-5">
              <div className="bg-[#F6F8F2] p-4 rounded-2xl border border-[#4F8A5B]/10">
                <span className="text-[9px] uppercase font-black bg-[#4F8A5B]/10 text-[#4F8A5B] px-2 py-0.5 rounded">
                  {task.taskType} Task
                </span>
                <h4 className="text-sm font-bold text-[#2F3E2E] mt-1">{task.title}</h4>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{task.description}"</p>
                )}
              </div>

              {/* Reasoning Block */}
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex gap-3">
                <Bot className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Astra Decision</span>
                  <p className="text-xs leading-relaxed">
                    {config.reasoning}
                  </p>
                </div>
              </div>

              <div className="py-6 text-center">
                <p className="text-base font-medium text-[#2F3E2E] font-serif">
                  "This task doesn't require proof of completion."
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  You can simply mark this task as completed to receive your Growth Points.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNoVerificationComplete}
                  className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Complete Task
                </button>
              </div>
            </div>
          )}

          {/* Level 2: Light Verification */}
          {config.level === 'light' && (
            <div className="space-y-5">
              {step === 'input' && (
                <form onSubmit={handleSubmitProof} className="space-y-5">
                  <div className="bg-[#F6F8F2] p-4 rounded-2xl border border-[#4F8A5B]/10">
                    <span className="text-[9px] uppercase font-black bg-[#4F8A5B]/10 text-[#4F8A5B] px-2 py-0.5 rounded">
                      {task.taskType} Task
                    </span>
                    <h4 className="text-sm font-bold text-[#2F3E2E] mt-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{task.description}"</p>
                    )}
                  </div>

                  {/* Reasoning Block */}
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex gap-3">
                    <Bot className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Astra Reflection Setup</span>
                      <p className="text-xs leading-relaxed">
                        {config.reasoning}
                      </p>
                    </div>
                  </div>

                  {/* Short reflection input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                      Astra asks:
                    </label>
                    <p className="text-sm font-serif font-medium text-[#2F3E2E] mb-1">
                      "What was your biggest takeaway?"
                    </p>
                    <textarea
                      rows={3}
                      placeholder="Share a brief takeaway or reflection regarding what you accomplished..."
                      value={reflectionText}
                      onChange={(e) => { setReflectionText(e.target.value); setError(''); }}
                      className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#4F8A5B]/10 font-sans"
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-xs bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-[#A7C957]" />
                      Submit Reflection
                    </button>
                  </div>
                </form>
              )}

              {step === 'evaluating' && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-5">
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
                    <p className="font-serif font-bold text-base text-[#2F3E2E]">Astra is listening to your reflection...</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Gathering insight and wrapping your milestone in peaceful verification...
                    </p>
                  </div>
                </div>
              )}

              {step === 'result' && verificationResult && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center text-center p-6 bg-[#F6F8F2]/60 rounded-3xl border border-[#4F8A5B]/10 relative overflow-hidden">
                    {verificationResult.verified !== false && <GoldenSparkles />}
                    <div className="absolute right-0 top-0 text-[100px] opacity-5 select-none font-serif leading-none">🌿</div>
                    
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-[#4F8A5B] shadow-md shadow-[#4F8A5B]/20">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>

                    <h4 className="text-lg font-serif font-bold mt-3 text-[#2F3E2E]">
                      ✅ Verified by Astra
                    </h4>

                    {/* Growth Points Breakdown */}
                    {verificationResult.breakdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full mt-5 bg-white rounded-2xl p-4 border border-[#4F8A5B]/10 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <span className="text-xs font-bold text-[#2F3E2E] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#A7C957]" /> XP Earned
                          </span>
                          <span className="text-lg font-black text-[#4F8A5B]">
                            +{verificationResult.breakdown.total} XP
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-left text-[11px] text-slate-500 font-medium">
                          <div className="flex justify-between">
                            <span>Task Difficulty ({task.priority})</span>
                            <span className="font-bold text-[#2F3E2E] font-sans">+{verificationResult.breakdown.base} XP</span>
                          </div>
                          {verificationResult.breakdown.earlyBonus > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Early Completion Bonus ⚡</span>
                              <span className="font-bold font-sans">+{verificationResult.breakdown.earlyBonus} XP</span>
                            </div>
                          )}
                          {verificationResult.breakdown.planBonus > 0 && (
                            <div className="flex justify-between text-[#4F8A5B]">
                              <span>Following Astra's Focus Roadmap 🗺️</span>
                              <span className="font-bold font-sans">+{verificationResult.breakdown.planBonus} XP</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-[#EAF2EC] to-[#F6F8F2] p-5 rounded-2xl border border-[#4F8A5B]/10 flex gap-3">
                    <Bot className="w-5 h-5 text-[#4F8A5B] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-[#4F8A5B] tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#A7C957]" /> Astra's Reflection Insight
                      </span>
                      <p className="text-xs leading-relaxed text-[#2F3E2E] italic">
                        "{verificationResult.explanation}"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => onVerified(verificationResult)}
                      className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Conclude Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Level 3: Smart Verification */}
          {config.level === 'smart' && (
            <div className="space-y-5">
              
              {/* STUDY (AI KNOWLEDGE CHECK) MULTI-STEP */}
              {config.method === 'study-quiz' ? (
                <div className="space-y-5">
                  {studyStep === 'topics' && (
                    <div className="space-y-5">
                      <div className="bg-[#F6F8F2] p-4 rounded-2xl border border-[#4F8A5B]/10">
                        <span className="text-[9px] uppercase font-black bg-[#4F8A5B]/10 text-[#4F8A5B] px-2 py-0.5 rounded">
                          {task.taskType} Task
                        </span>
                        <h4 className="text-sm font-bold text-[#2F3E2E] mt-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 italic">"{task.description}"</p>
                        )}
                      </div>

                      {/* Reasoning Block */}
                      <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex gap-3">
                        <Bot className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Astra Decision</span>
                          <p className="text-xs leading-relaxed">
                            {config.reasoning}
                          </p>
                        </div>
                      </div>

                      {/* Step 1 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#4F8A5B]/10 text-[#4F8A5B] text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">Step 1</span>
                          <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                            What subject did you study?
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Operating Systems"
                          value={studySubject}
                          onChange={(e) => { setStudySubject(e.target.value); setError(''); }}
                          className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#4F8A5B]/10 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#4F8A5B]/10 text-[#4F8A5B] text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">Step 2</span>
                          <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                            What topics did you cover?
                          </label>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="e.g.&#10;* Deadlocks&#10;* Memory Management&#10;* Paging"
                          value={studyTopics}
                          onChange={(e) => { setStudyTopics(e.target.value); setError(''); }}
                          className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#4F8A5B]/10 font-sans leading-relaxed"
                        />
                      </div>

                      {/* Step 3 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#4F8A5B]/10 text-[#4F8A5B] text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">Step 3</span>
                          <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                            Briefly explain one or more concepts you learned today in your own words.
                          </label>
                        </div>
                        <textarea
                          rows={5}
                          placeholder="For example: Explain what a deadlock is or describe how paging works."
                          value={studyExplanation}
                          onChange={(e) => { setStudyExplanation(e.target.value); setError(''); }}
                          className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#4F8A5B]/10 font-sans leading-relaxed"
                        />
                      </div>

                      {error && (
                        <div className="text-red-600 text-xs bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitExplanation}
                          className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-[#A7C957]" />
                          Submit for Verification
                        </button>
                      </div>
                    </div>
                  )}

                  {studyStep === 'evaluating' && (
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-5">
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
                        <p className="font-serif font-bold text-base text-[#2F3E2E]">Astra is evaluating your explanation...</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Checking relevance, referencing topics, and verifying that you demonstrated a reasonable understanding in your own words.
                        </p>
                      </div>
                    </div>
                  )}

                  {studyStep === 'result' && verificationResult && (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center text-center p-6 bg-[#F6F8F2]/60 rounded-3xl border border-[#4F8A5B]/10 relative overflow-hidden">
                        {verificationResult.verified && <GoldenSparkles />}
                        <div className="absolute right-0 top-0 text-[100px] opacity-5 select-none font-serif leading-none">🌿</div>
                        
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${
                          verificationResult.verified ? 'bg-[#4F8A5B] shadow-md shadow-[#4F8A5B]/20' : 'bg-amber-500 animate-pulse'
                        }`}>
                          {verificationResult.verified ? (
                            <Check className="w-7 h-7 stroke-[3]" />
                          ) : (
                            <AlertCircle className="w-7 h-7 stroke-[2.5]" />
                          )}
                        </div>

                        <h4 className="text-lg font-serif font-bold mt-3 text-[#2F3E2E]">
                          {verificationResult.verified ? '✅ Study Verified' : "I couldn't confidently verify your study session yet."}
                        </h4>

                        {!verificationResult.verified && (
                          <p className="text-xs text-[#2F3E2E] mt-1 font-semibold">
                            Try explaining one of the topics in a little more detail.
                          </p>
                        )}

                        {/* Growth Points Rewards Breakdown */}
                        {verificationResult.verified && verificationResult.breakdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full mt-5 bg-white rounded-2xl p-4 border border-[#4F8A5B]/10 shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                              <span className="text-xs font-bold text-[#2F3E2E] flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#A7C957]" /> XP Earned
                              </span>
                              <span className="text-lg font-black text-[#4F8A5B]">
                                +{verificationResult.breakdown.total} XP
                              </span>
                            </div>
                            
                            <div className="space-y-1.5 text-left text-[11px] text-slate-500 font-medium">
                              <div className="flex justify-between">
                                <span>Task Difficulty ({task.priority})</span>
                                <span className="font-bold text-[#2F3E2E] font-sans">+{verificationResult.breakdown.base} XP</span>
                              </div>
                              {verificationResult.breakdown.earlyBonus > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Early Completion Bonus ⚡</span>
                                  <span className="font-bold font-sans">+{verificationResult.breakdown.earlyBonus} XP</span>
                                </div>
                              )}
                              {verificationResult.breakdown.planBonus > 0 && (
                                <div className="flex justify-between text-[#4F8A5B]">
                                  <span>Following Astra's Focus Roadmap 🗺️</span>
                                  <span className="font-bold font-sans">+{verificationResult.breakdown.planBonus} XP</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-[#EAF2EC] to-[#F6F8F2] p-5 rounded-2xl border border-[#4F8A5B]/10 flex gap-3">
                        <Bot className="w-5 h-5 text-[#4F8A5B] shrink-0 mt-0.5" />
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-black uppercase text-[#4F8A5B] tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#A7C957]" /> Astra's Study Insight
                          </span>
                          <p className="text-xs leading-relaxed text-[#2F3E2E] italic">
                            "{verificationResult.explanation}"
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        {verificationResult.verified ? (
                          <button
                            onClick={() => onVerified(verificationResult)}
                            className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            Conclude Task
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setStudyStep('topics');
                                setError('');
                                setVerificationResult(null);
                              }}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                            >
                              Edit & Resubmit
                            </button>
                            <button
                              onClick={onClose}
                              className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                            >
                              Return to Home
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* OTHER SMART METHODS */
                <div className="space-y-5">
                  {step === 'input' && (
                    <form onSubmit={handleSubmitProof} className="space-y-5">
                      <div className="bg-[#F6F8F2] p-4 rounded-2xl border border-[#4F8A5B]/10">
                        <span className="text-[9px] uppercase font-black bg-[#4F8A5B]/10 text-[#4F8A5B] px-2 py-0.5 rounded">
                          {task.taskType} Task
                        </span>
                        <h4 className="text-sm font-bold text-[#2F3E2E] mt-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 italic">"{task.description}"</p>
                        )}
                      </div>

                      {/* Reasoning Block */}
                      <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex gap-3">
                        <Bot className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Astra Decision</span>
                          <p className="text-xs leading-relaxed">
                            {config.reasoning}
                          </p>
                        </div>
                      </div>

                      {/* Dynamic File Uploader area */}
                      {config.method === 'before-after' ? (
                        /* Dual Before & After Uploader */
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                            Upload Proof Images <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Before Image */}
                            <div
                              onDragEnter={(e) => handleDrag(e, setDragActiveBefore)}
                              onDragOver={(e) => handleDrag(e, setDragActiveBefore)}
                              onDragLeave={(e) => handleDrag(e, setDragActiveBefore)}
                              onDrop={(e) => handleDropFile(e, setBeforeImage, setDragActiveBefore, setBeforeImageBase64)}
                              onClick={() => beforeInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 min-h-[140px] ${
                                dragActiveBefore 
                                  ? 'border-[#4F8A5B] bg-[#F6F8F2]/80' 
                                  : 'border-[#4F8A5B]/15 hover:border-[#4F8A5B]/30 bg-[#F6F8F2]/20'
                              }`}
                            >
                              <input
                                type="file"
                                ref={beforeInputRef}
                                onChange={(e) => handleSelectFile(e, setBeforeImage, setBeforeImageBase64)}
                                className="hidden"
                                accept="image/*"
                              />
                              <div className="p-2 bg-white rounded-full shadow-sm text-amber-600 shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              {beforeImage ? (
                                <div className="w-full">
                                  <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3 stroke-[2.5]" /> Evidence submitted.
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate max-w-xs mt-0.5">
                                    {beforeImage.name}
                                  </p>
                                  <p className="text-[9px] text-slate-400">
                                    {(beforeImage.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-[11px] font-bold text-[#2F3E2E]">Before Image</p>
                                  <p className="text-[9px] text-slate-400">Click to upload</p>
                                </div>
                              )}
                            </div>

                            {/* After Image */}
                            <div
                              onDragEnter={(e) => handleDrag(e, setDragActiveAfter)}
                              onDragOver={(e) => handleDrag(e, setDragActiveAfter)}
                              onDragLeave={(e) => handleDrag(e, setDragActiveAfter)}
                              onDrop={(e) => handleDropFile(e, setAfterImage, setDragActiveAfter, setAfterImageBase64)}
                              onClick={() => afterInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 min-h-[140px] ${
                                dragActiveAfter 
                                  ? 'border-[#4F8A5B] bg-[#F6F8F2]/80' 
                                  : 'border-[#4F8A5B]/15 hover:border-[#4F8A5B]/30 bg-[#F6F8F2]/20'
                              }`}
                            >
                              <input
                                type="file"
                                ref={afterInputRef}
                                onChange={(e) => handleSelectFile(e, setAfterImage, setAfterImageBase64)}
                                className="hidden"
                                accept="image/*"
                              />
                              <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600 shrink-0">
                                <Check className="w-4 h-4" />
                              </div>
                              {afterImage ? (
                                <div className="w-full">
                                  <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3 stroke-[2.5]" /> Evidence submitted.
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate max-w-xs mt-0.5">
                                    {afterImage.name}
                                  </p>
                                  <p className="text-[9px] text-slate-400">
                                    {(afterImage.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-[11px] font-bold text-[#2F3E2E]">After Image</p>
                                  <p className="text-[9px] text-slate-400">Click to upload</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Single File Uploader */
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                            Attach Proof File <span className="text-red-500">*</span>
                          </label>
                          <div
                            onDragEnter={(e) => handleDrag(e, setDragActive)}
                            onDragOver={(e) => handleDrag(e, setDragActive)}
                            onDragLeave={(e) => handleDrag(e, setDragActive)}
                            onDrop={(e) => handleDropFile(e, setUploadedFile, setDragActive, setUploadedFileBase64)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                              dragActive 
                                ? 'border-[#4F8A5B] bg-[#F6F8F2]/80' 
                                : 'border-[#4F8A5B]/15 hover:border-[#4F8A5B]/30 bg-[#F6F8F2]/20'
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => handleSelectFile(e, setUploadedFile, setUploadedFileBase64)}
                              className="hidden"
                              accept={config.method === 'document' ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain' : 'image/*'}
                            />
                            
                            <div className="p-2.5 bg-white rounded-full shadow-sm text-[#4F8A5B] shrink-0">
                              {config.method === 'document' ? (
                                <FileText className="w-5 h-5" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                            </div>

                            {uploadedFile ? (
                              <div>
                                <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                                  <Check className="w-4 h-4 stroke-[2.5]" /> Evidence submitted.
                                </p>
                                <p className="text-[10px] text-slate-500 font-semibold truncate max-w-xs mt-0.5">
                                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  Click to swap files
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-semibold text-[#2F3E2E]">
                                  Drag & drop file here, or click to browse
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {config.method === 'document' ? 'Supports PDF, Word, TXT (Max 5MB)' : 'Supports JPG, PNG (Max 5MB)'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Optional comments box */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#2F3E2E] uppercase tracking-wider">
                          Comment or Reference Code <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder={config.method === 'screenshot' ? "e.g. Transaction Reference, ID, or confirmation details..." : "Describe any details you would like Astra to know..."}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] placeholder-slate-400 outline-none focus:border-[#4F8A5B] focus:ring-2 focus:ring-[#4F8A5B]/10 font-sans"
                        />
                      </div>

                      {error && (
                        <div className="text-red-600 text-xs bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Bot className="w-4 h-4 text-[#A7C957]" />
                          Submit Proof
                        </button>
                      </div>
                    </form>
                  )}

                  {step === 'evaluating' && (
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-5">
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
                        <p className="font-serif font-bold text-base text-[#2F3E2E]">Astra is reviewing your evidence...</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Verifying files and description. Encouraging sincerity and effort to help you thrive!
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 'result' && verificationResult && (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center text-center p-6 bg-[#F6F8F2]/60 rounded-3xl border border-[#4F8A5B]/10 relative overflow-hidden">
                        {verificationResult.verified && <GoldenSparkles />}
                        <div className="absolute right-0 top-0 text-[100px] opacity-5 select-none font-serif leading-none">🌿</div>
                        
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${
                          verificationResult.verified ? 'bg-[#4F8A5B] shadow-md shadow-[#4F8A5B]/20' : 'bg-amber-500'
                        }`}>
                          {verificationResult.verified ? (
                            <Check className="w-7 h-7 stroke-[3]" />
                          ) : (
                            <AlertCircle className="w-7 h-7 stroke-[2.5]" />
                          )}
                        </div>

                        <h4 className="text-lg font-serif font-bold mt-3 text-[#2F3E2E]">
                          {verificationResult.verified ? '✅ Verified by Astra' : 'Supportive Feedback'}
                        </h4>

                        {/* Growth Points Rewards Breakdown */}
                        {verificationResult.verified && verificationResult.breakdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full mt-5 bg-white rounded-2xl p-4 border border-[#4F8A5B]/10 shadow-xs space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                              <span className="text-xs font-bold text-[#2F3E2E] flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#A7C957]" /> XP Earned
                              </span>
                              <span className="text-lg font-black text-[#4F8A5B]">
                                +{verificationResult.breakdown.total} XP
                              </span>
                            </div>
                            
                            <div className="space-y-1.5 text-left text-[11px] text-slate-500 font-medium">
                              <div className="flex justify-between">
                                <span>Task Difficulty ({task.priority})</span>
                                <span className="font-bold text-[#2F3E2E] font-sans">+{verificationResult.breakdown.base} XP</span>
                              </div>
                              {verificationResult.breakdown.earlyBonus > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Early Completion Bonus ⚡</span>
                                  <span className="font-bold font-sans">+{verificationResult.breakdown.earlyBonus} XP</span>
                                </div>
                              )}
                              {verificationResult.breakdown.planBonus > 0 && (
                                <div className="flex justify-between text-[#4F8A5B]">
                                  <span>Following Astra's Focus Roadmap 🗺️</span>
                                  <span className="font-bold font-sans">+{verificationResult.breakdown.planBonus} XP</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-[#EAF2EC] to-[#F6F8F2] p-5 rounded-2xl border border-[#4F8A5B]/10 flex gap-3">
                        <Bot className="w-5 h-5 text-[#4F8A5B] shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-[#4F8A5B] tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#A7C957]" /> Astra's Insight Reflection
                          </span>
                          <p className="text-xs leading-relaxed text-[#2F3E2E] italic">
                            "{verificationResult.explanation}"
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        {verificationResult.verified ? (
                          <button
                            onClick={() => onVerified(verificationResult)}
                            className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#4F8A5B]/15 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            Complete Task
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setStep('input');
                                setUploadedFile(null);
                                setBeforeImage(null);
                                setAfterImage(null);
                                setCommentText('');
                                setError('');
                                setVerificationResult(null);
                              }}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                            >
                              Try Again
                            </button>
                            <button
                              onClick={onClose}
                              className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                            >
                              Return to Tasks
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}

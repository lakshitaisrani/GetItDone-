/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskType, TaskPriority, TaskStatus, UserProfile, AstraMessage, RecentActivity, Idea, Reminder } from './types';
import TaskCard from './components/TaskCard';
import AddEditTaskView from './components/AddEditTaskView';
import AstraPlanningView, { isLargeOrComplexProject } from './components/AstraPlanningView';
import IdeaInboxView from './components/IdeaInboxView';
import GentleCheckInModal from './components/GentleCheckInModal';
import TaskVerificationView from './components/TaskVerificationView';
import FocusSessionModal from './components/FocusSessionModal';
import PlanMyDayModal from './components/PlanMyDayModal';
import ThemePreviewGallery from './components/ThemePreviewGallery';
import NewThemeUnlockedModal from './components/NewThemeUnlockedModal';
import ParsedTasksReviewCard from './components/ParsedTasksReviewCard';
import { THEMES, getThemeById, generateThemeCSS, Theme } from './themes';
import SplashAndAuth from './components/SplashAndAuth';
import { generateRemindersForTask, getTriggeredReminders, getTaskDeadlineDate } from './lib/reminderUtils';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Plus, 
  User as UserIcon, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  BookOpen, 
  Activity, 
  Send, 
  RefreshCw,
  Heart,
  Bot,
  MessageCircle,
  X,
  PlusCircle,
  Award,
  Trash2,
  Clock,
  AlertTriangle,
  LogOut,
  Mail,
  Bell,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Default tasks to seed if localStorage is empty
const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Biology Lab Report',
    description: 'Analyze sample structures and formulate findings on cellular transport mechanisms.',
    taskType: 'Assignment',
    priority: 'High',
    deadline: new Date().toLocaleDateString('en-CA'), // Today's date
    estimatedDuration: 120,
    notes: 'Include statistical graphs and charts',
    status: 'Pending',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Meditation & Yoga',
    description: 'Re-center with 45 minutes of core flow and calming deep breaths.',
    taskType: 'Workout',
    priority: 'Low',
    deadline: new Date().toLocaleDateString('en-CA'), // Today's date
    estimatedDuration: 45,
    notes: 'Focus on breathing rhythm',
    status: 'Completed',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Design System Review',
    description: 'Perfect the typography and UI color scheme variations.',
    taskType: 'Meeting',
    priority: 'Medium',
    deadline: new Date().toLocaleDateString('en-CA'), // Today's date
    estimatedDuration: 60,
    notes: 'Review button hover effects & focus rings',
    status: 'Pending',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Water Houseplants',
    description: 'Check moisture levels and water the office plants.',
    taskType: 'Personal',
    priority: 'Low',
    deadline: new Date().toLocaleDateString('en-CA'), // Today's date
    estimatedDuration: 15,
    status: 'Completed',
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Review Electricity Bill',
    description: 'Process payment for utility conservation program.',
    taskType: 'Bills',
    priority: 'Medium',
    deadline: new Date(Date.now() + 86400000).toLocaleDateString('en-CA'), // Tomorrow
    estimatedDuration: 15,
    status: 'Pending',
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Read Ecology Journal',
    description: 'Latest research on system optimization and cognitive focus models.',
    taskType: 'Reading',
    priority: 'Low',
    deadline: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-CA'), // 3 Days from now
    estimatedDuration: 30,
    status: 'Pending',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Elena',
  avatarSeed: 'E',
  streak: 4,
  lastCompletedDate: new Date().toLocaleDateString('en-CA'),
  joinDate: '2026-06-20',
  growthPoints: 120
};

const DEFAULT_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    type: 'complete',
    taskTitle: 'Meditation & Yoga',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'act-2',
    type: 'create',
    taskTitle: 'Biology Lab Report',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'act-3',
    type: 'complete',
    taskTitle: 'Water Houseplants',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export interface LevelInfo {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  percent: number;
}

export const getLevelInfo = (xp: number): LevelInfo => {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentThreshold = thresholds[level - 1];
  const nextThreshold = thresholds[level] || (currentThreshold + level * 1000);
  const nextLevelXP = nextThreshold - currentThreshold;
  const currentXP = xp - currentThreshold;
  const percent = Math.min((currentXP / nextLevelXP) * 100, 100);
  
  return {
    level,
    currentXP,
    nextLevelXP,
    percent
  };
};

export default function App() {
  // State variables with LocalStorage backup
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('getitdone_tasks');
    const list: Task[] = saved ? JSON.parse(saved) : DEFAULT_TASKS;
    const seenIds = new Set<string>();
    return list.map((task, index) => {
      let uniqueId = task.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        uniqueId = `task-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
      }
      seenIds.add(uniqueId);
      return { ...task, id: uniqueId };
    });
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('getitdone_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [activities, setActivities] = useState<RecentActivity[]>(() => {
    const saved = localStorage.getItem('getitdone_activities');
    const list: RecentActivity[] = saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
    const seenIds = new Set<string>();
    return list.map((act, index) => {
      let uniqueId = act.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        uniqueId = `act-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
      }
      seenIds.add(uniqueId);
      return { ...act, id: uniqueId };
    });
  });

  const [currentTab, setCurrentTab] = useState<'Home' | 'Calendar' | 'Profile' | 'Inbox'>('Home');
  const [homeTaskFilter, setHomeTaskFilter] = useState<'today' | 'pending' | 'completed'>('today');

  // Smart Reminder & Time Tracking State
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [previouslyTriggeredIds, setPreviouslyTriggeredIds] = useState<Set<string>>(() => new Set());
  const [previouslyOverdueIds, setPreviouslyOverdueIds] = useState<Set<string>>(() => new Set());
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    try {
      const saved = localStorage.getItem('getitdone_ideas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSplashAndAuth, setShowSplashAndAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingReschedule, setPendingReschedule] = useState<{ originalTask: Task; taskData: any } | null>(null);

  const handleAuthComplete = (userName: string, email?: string) => {
    setIsAuthenticated(true);
    setShowSplashAndAuth(false);
    if (userName && userName !== profile.name) {
      setProfile(p => ({
        ...p,
        name: userName,
        avatarSeed: userName.charAt(0).toUpperCase() || 'E'
      }));
      setSettingsName(userName);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('getitdone_logged_in_user');
    setIsAuthenticated(false);
    setShowSplashAndAuth(true);
  };

  const [profileSubTab, setProfileSubTab] = useState<'Appearance' | 'Settings'>('Appearance');
  const [recentlyUnlockedTheme, setRecentlyUnlockedTheme] = useState<Theme | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [planningTaskData, setPlanningTaskData] = useState<Omit<Task, 'id' | 'createdAt'> & { id?: string } | null>(null);
  const [verifyingTask, setVerifyingTask] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [planMyDayOpen, setPlanMyDayOpen] = useState(false);
  
  // Astra AI Message states
  const [astraMsg, setAstraMsg] = useState<AstraMessage | null>(null);
  const [isAstraLoading, setIsAstraLoading] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; sender: 'user' | 'astra'; timestamp: string; parsedTasks?: any[]; suggestBreakdownTaskId?: string }[]>([
    {
      id: 'welcome',
      text: "Hello! 🌿 I am Astra, your peaceful productivity companion. I notice you have some exciting items on your schedule. How can I help you clear your mind or map out your focus steps today?",
      sender: 'astra',
      timestamp: new Date().toISOString()
    }
  ]);
  const [userChatInput, setUserChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Calendar states
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );

  // Settings modification states
  const [settingsName, setSettingsName] = useState(profile.name);
  const [settingsStreak, setSettingsStreak] = useState(profile.streak);

  // Weekly Reflection States
  const [weeklyReflection, setWeeklyReflection] = useState<{ summary: string; suggestions: string[] } | null>(() => {
    const saved = localStorage.getItem('getitdone_weekly_reflection');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);

  const handleGenerateWeeklyReflection = async () => {
    setIsGeneratingReflection(true);
    try {
      const res = await fetch('/api/astra/weekly-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          userName: profile.name,
          streak: profile.streak,
          growthPoints: profile.growthPoints || 0
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklyReflection(data);
        localStorage.setItem('getitdone_weekly_reflection', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to generate weekly reflection:', err);
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('getitdone_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('getitdone_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('getitdone_activities', JSON.stringify(activities));
  }, [activities]);

  // Tick current time every 5 seconds for real-time automatic reminder checking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Request browser notification permission gently when the app mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Ensure every task with a deadline has scheduled reminders
  useEffect(() => {
    let changed = false;
    const updatedTasks = tasks.map(task => {
      if (task.deadline) {
        const rawExpectedReminders = generateRemindersForTask(task);
        const expectedReminders = rawExpectedReminders.map(expected => {
          const existing = task.reminders?.find(r => r.id === expected.id);
          if (existing && existing.triggerTime === expected.triggerTime) {
            return {
              ...expected,
              dismissedPopup: existing.dismissedPopup,
              read: existing.read,
              ignored: existing.ignored !== undefined ? existing.ignored : expected.ignored
            };
          }
          return expected;
        });

        const remindersChanged = !task.reminders || JSON.stringify(task.reminders) !== JSON.stringify(expectedReminders);

        if (remindersChanged) {
          changed = true;
          return { ...task, reminders: expectedReminders };
        }
      }
      return task;
    });

    if (changed) {
      setTasks(updatedTasks);
    }
  }, [tasks]);

  // Handle browser notifications for newly triggered reminders
  useEffect(() => {
    const currentTriggered = getTriggeredReminders(tasks, currentTime);
    const newlyTriggered = currentTriggered.filter(item => !previouslyTriggeredIds.has(item.reminder.id));

    if (newlyTriggered.length > 0) {
      newlyTriggered.forEach(item => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              new Notification('🔔 Reminder', {
                body: item.reminder.message,
              });
            } catch (err) {
              console.error('Error showing browser notification:', err);
            }
          }
        }
      });

      setPreviouslyTriggeredIds(prev => {
        const next = new Set<string>(prev);
        currentTriggered.forEach(item => next.add(item.reminder.id));
        return next;
      });
    }
  }, [tasks, currentTime]);

  // Handle browser notifications for newly overdue tasks
  useEffect(() => {
    const activeOverdue = tasks.filter(t => t.status === 'Pending' && t.deadline && getTaskDeadlineDate(t).getTime() < currentTime.getTime());
    const newlyOverdue = activeOverdue.filter(t => !previouslyOverdueIds.has(t.id));

    if (newlyOverdue.length > 0) {
      newlyOverdue.forEach(t => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              new Notification('⚠️ Task Overdue', {
                body: `"${t.title}" is overdue.`,
              });
            } catch (err) {
              console.error('Error showing browser notification:', err);
            }
          }
        }
      });

      setPreviouslyOverdueIds(prev => {
        const next = new Set<string>(prev);
        activeOverdue.forEach(t => next.add(t.id));
        return next;
      });
    }
  }, [tasks, currentTime]);

  const getDeadlineTimeRemaining = (task: Task) => {
    const deadlineDate = getTaskDeadlineDate(task);
    const diffMs = deadlineDate.getTime() - currentTime.getTime();
    if (diffMs <= 0) return 'Overdue';
    
    const totalMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };

  const handleDismissPopupReminder = (taskId: string, reminderId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.reminders) {
        return {
          ...t,
          reminders: t.reminders.map(r => r.id === reminderId ? { ...r, dismissedPopup: true } : r)
        };
      }
      return t;
    }));
  };

  const handleMarkAsRead = (taskId: string, reminderId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.reminders) {
        return {
          ...t,
          reminders: t.reminders.map(r => r.id === reminderId ? { ...r, read: true, dismissedPopup: true } : r)
        };
      }
      return t;
    }));
  };

  const handleOpenTaskFromReminder = (task: Task, reminder?: Reminder) => {
    if (reminder) {
      setTasks(prev => prev.map(t => {
        if (t.id === task.id && t.reminders) {
          return {
            ...t,
            reminders: t.reminders.map(r => r.id === reminder.id ? { ...r, dismissedPopup: true, read: true } : r)
          };
        }
        return t;
      }));
    }

    setShowNotificationsDropdown(false);
    setCurrentTab('Home');

    if (task.status === 'Completed') {
      setHomeTaskFilter('completed');
    } else {
      const isToday = new Date(task.deadline).toDateString() === currentTime.toDateString();
      if (isToday) {
        setHomeTaskFilter('today');
      } else {
        setHomeTaskFilter('pending');
      }
    }

    setHighlightedTaskId(task.id);
    
    setTimeout(() => {
      const el = document.getElementById(`task-card-${task.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedTaskId(null);
    }, 3000);
  };

  const handleDismissReminder = (taskId: string, reminderId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.reminders) {
        return {
          ...t,
          reminders: t.reminders.map(r => r.id === reminderId ? { ...r, ignored: true } : r)
        };
      }
      return t;
    }));
  };

  // Automatically dismiss active popup reminders when notifications panel is opened
  useEffect(() => {
    if (showNotificationsDropdown) {
      setTasks(prev => prev.map(t => {
        const reminders = t.reminders || [];
        const hasVisibleReminders = reminders.some(r => {
          const isTriggered = new Date(r.triggerTime).getTime() <= currentTime.getTime() && t.status === 'Pending';
          return isTriggered && !r.dismissedPopup && !r.read;
        });
        if (hasVisibleReminders) {
          return {
            ...t,
            reminders: reminders.map(r => {
              const isTriggered = new Date(r.triggerTime).getTime() <= currentTime.getTime() && t.status === 'Pending';
              if (isTriggered && !r.dismissedPopup && !r.read) {
                return { ...r, dismissedPopup: true };
              }
              return r;
            })
          };
        }
        return t;
      }));
    }
  }, [showNotificationsDropdown, currentTime]);

  // Fetch initial Astra message
  useEffect(() => {
    fetchAstraMessage();
  }, []);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, coachingOpen]);

  const fetchAstraMessage = async () => {
    setIsAstraLoading(true);
    try {
      const response = await fetch('/api/astra/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks,
          userName: profile.name,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAstraMsg(data);
      } else {
        throw new Error('Server returned non-ok status');
      }
    } catch (err) {
      console.warn('Astra API call failed, using beautiful fallback offline message', err);
      // Fallback local message using programmatic contextual generator
      setAstraMsg({
        text: getLocalAstraRecommendation(tasks),
        category: 'focus',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsAstraLoading(false);
    }
  };

  const logActivity = (type: 'create' | 'complete' | 'delete' | 'edit', taskTitle: string) => {
    const newAct: RecentActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      taskTitle,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newAct, ...prev.slice(0, 9)]);
  };

  // Task event handlers
  const handleToggleComplete = (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    if (targetTask.status === 'Completed') {
      // Toggle back to Pending instantly
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          logActivity('edit', t.title);
          return { ...t, status: 'Pending' };
        }
        return t;
      }));
    } else if (targetTask.verificationMethod === 'No Verification') {
      // Complete instantly without modal!
      const pointsToAward = 15;
      const prevXP = profile.growthPoints || 0;
      const newXP = prevXP + pointsToAward;
      const prevLevel = getLevelInfo(prevXP).level;
      const newLevel = getLevelInfo(newXP).level;

      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          logActivity('complete', t.title);
          return { ...t, status: 'Completed' };
        }
        return t;
      }));

      setProfile(prev => ({ ...prev, growthPoints: newXP }));

      if (newLevel > prevLevel) {
        const unlockedTheme = THEMES.find(t => t.levelRequired === newLevel);
        if (unlockedTheme) {
          setRecentlyUnlockedTheme(unlockedTheme);
          const celebrateMsg = `Congratulations! Your consistency unlocked the ${unlockedTheme.name} ${unlockedTheme.emoji}. Enjoy your new workspace.`;
          setChatMessages(prev => [
            ...prev,
            { 
              id: `unlock-${Date.now()}`,
              sender: 'astra', 
              text: celebrateMsg, 
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            }
          ]);
        }
      }
    } else {
      // Intercept with Task Verification Modal!
      setVerifyingTask(targetTask);
    }
  };

  const handleVerificationSuccess = (verifiedResult: any) => {
    if (!verifyingTask) return;

    const pointsToAward = verifiedResult.gpEarned || 15;

    // Check for level up before updating profile state
    const prevXP = profile.growthPoints || 0;
    const newXP = prevXP + pointsToAward;
    const prevLevel = getLevelInfo(prevXP).level;
    const newLevel = getLevelInfo(newXP).level;

    if (newLevel > prevLevel) {
      const unlockedTheme = THEMES.find(t => t.levelRequired === newLevel);
      if (unlockedTheme) {
        setRecentlyUnlockedTheme(unlockedTheme);
        const celebrateMsg = `Congratulations! Your consistency unlocked the ${unlockedTheme.name} ${unlockedTheme.emoji}. Enjoy your new workspace.`;
        setChatMessages(prev => [
          ...prev,
          { 
            id: `unlock-${Date.now()}`,
            sender: 'astra', 
            text: celebrateMsg, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
        setAstraMsg({
          text: celebrateMsg,
          category: 'motivation',
          timestamp: new Date().toLocaleDateString()
        });
      }
    }

    setTasks(prev => prev.map(t => {
      if (t.id === verifyingTask.id) {
        logActivity('complete', t.title);
        
        // Update streak dynamically if task was completed
        const todayStr = new Date().toLocaleDateString('en-CA');
        setProfile(p => {
          const currentGP = p.growthPoints || 0;
          const isNewDay = p.lastCompletedDate !== todayStr;
          return {
            ...p,
            streak: isNewDay ? p.streak + 1 : p.streak,
            lastCompletedDate: todayStr,
            growthPoints: currentGP + pointsToAward
          };
        });

        return { 
          ...t, 
          status: 'Completed',
          verificationProof: {
            verified: true,
            confidence: verifiedResult.confidence,
            explanation: verifiedResult.explanation,
            timestamp: new Date().toISOString()
          }
        };
      }
      return t;
    }));

    setVerifyingTask(null);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        const updatedSubtasks = t.subtasks.map(sub => 
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const subtasks = t.subtasks || [];
        const newSub = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title,
          completed: false
        };
        return { ...t, subtasks: [...subtasks, newSub] };
      }
      return t;
    }));
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subtasks) {
        return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
      }
      return t;
    }));
  };

  const handleConfirmReschedule = (finalTaskData: any) => {
    setTasks(prev => prev.map(t => {
      if (t.id === finalTaskData.id) {
        logActivity('edit', finalTaskData.title);
        return {
          ...t,
          title: finalTaskData.title,
          description: finalTaskData.description,
          taskType: finalTaskData.taskType,
          priority: finalTaskData.priority,
          deadline: finalTaskData.deadline,
          estimatedDuration: finalTaskData.estimatedDuration,
          notes: finalTaskData.notes,
          status: finalTaskData.status,
          planExplanation: finalTaskData.planExplanation !== undefined ? finalTaskData.planExplanation : t.planExplanation,
          subtasks: finalTaskData.subtasks !== undefined ? finalTaskData.subtasks : t.subtasks,
        };
      }
      return t;
    }));
    setPendingReschedule(null);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      const originalTask = tasks.find(t => t.id === taskData.id);
      if (originalTask && originalTask.deadline !== taskData.deadline) {
        // Intercept reschedule/postpone
        setPendingReschedule({ originalTask, taskData });
        setTaskModalOpen(false);
        setEditingTask(null);
        return;
      }

      // Edit mode: save immediately
      setTasks(prev => prev.map(t => {
        if (t.id === taskData.id) {
          logActivity('edit', taskData.title);
          return {
            ...t,
            title: taskData.title,
            description: taskData.description,
            taskType: taskData.taskType,
            priority: taskData.priority,
            deadline: taskData.deadline,
            estimatedDuration: taskData.estimatedDuration,
            notes: taskData.notes,
            status: taskData.status,
          };
        }
        return t;
      }));
      setTaskModalOpen(false);
      setEditingTask(null);
    } else {
      // Create mode: Trigger Astra Planning modal first!
      setPlanningTaskData(taskData);
      setTaskModalOpen(false);
    }
  };

  const handleSavePlannedTask = (finalTask: Task) => {
    setTasks(prev => [finalTask, ...prev]);
    logActivity('create', finalTask.title);
    setPlanningTaskData(null);
    setEditingTask(null);
  };

  const handleApproveParsedTasks = async (messageId: string, approvedTasks: any[]) => {
    // 1. Create task items
    const newTasks: Task[] = approvedTasks.map(t => {
      const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return {
        id,
        createdAt: new Date().toISOString(),
        title: t.title,
        description: t.description || '',
        taskType: t.taskType || 'Other',
        priority: t.priority || 'Medium',
        deadline: t.deadline || new Date().toLocaleDateString('en-CA'),
        estimatedDuration: t.estimatedDuration || 30,
        status: 'Pending',
        verificationMethod: t.verificationMethod || 'Short Reflection',
        notes: t.notes || '',
        subtasks: []
      };
    });

    // 2. Add to tasks list
    setTasks(prev => [...newTasks, ...prev]);
    newTasks.forEach(t => logActivity('create', t.title));

    // 3. Mark the message as approved/empty so we update the UI card state
    // and append Astra's instant success confirmation.
    const complexTasks = newTasks.filter(t => isLargeOrComplexProject(t.title, t.description, t.taskType));
    const hasComplex = complexTasks.length > 0;
    const suggestBreakdownTaskId = hasComplex ? complexTasks[0].id : undefined;

    const taskTitles = newTasks.map(nt => nt.title).join(', ');
    const isPlural = newTasks.length > 1;
    let successText = `✅ ${taskTitles} ${isPlural ? 'have' : 'has'} been added to your schedule.`;
    if (hasComplex) {
      successText += `\n\nThis looks like a larger task. Would you like me to break it into smaller steps?`;
    } else {
      successText += `\n\nWould you like me to suggest the best time to complete ${isPlural ? 'them' : 'it'}?`;
    }

    setChatMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === messageId) {
          return { ...m, parsedTasks: [] };
        }
        return m;
      });
      return [
        ...updated,
        {
          id: `msg-success-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          text: successText,
          sender: 'astra',
          timestamp: new Date().toISOString(),
          suggestBreakdownTaskId
        }
      ];
    });

    // 4. Background plan generation for non-complex tasks
    const regularTasks = newTasks.filter(t => !isLargeOrComplexProject(t.title, t.description, t.taskType));
    regularTasks.forEach(async (t) => {
      try {
        const res = await fetch('/api/task/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: t, generateSubtasks: false })
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(prev => prev.map(pt => {
            if (pt.id === t.id) {
              return {
                ...pt,
                subtasks: [],
                planExplanation: data.planExplanation,
                estimatedDuration: data.estimatedDuration || pt.estimatedDuration,
                priority: data.priority || pt.priority
              };
            }
            return pt;
          }));
        }
      } catch (err) {
        console.warn('Background plan generation failed for task:', t.title, err);
      }
    });

    // 5. Open Plan My Day if multiple tasks were added
    if (newTasks.length > 1) {
      setTimeout(() => {
        setPlanMyDayOpen(true);
      }, 500);
    }
  };

  const handleAddDirectTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    logActivity('create', task.title);
  };

  const handleDeleteTask = (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (targetTask) {
      logActivity('delete', targetTask.title);
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleTriggerTaskBreakdown = async (messageId: string, taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, suggestBreakdownTaskId: undefined } : m));

    const workingId = `msg-working-${Date.now()}`;
    setChatMessages(prev => [
      ...prev,
      {
        id: workingId,
        text: `⏳ Astra is breaking down "${targetTask.title}" into smaller steps...`,
        sender: 'astra',
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      const res = await fetch('/api/task/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: targetTask, generateSubtasks: true })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => prev.map(pt => {
          if (pt.id === taskId) {
            return {
              ...pt,
              subtasks: data.subtasks || [],
              planExplanation: data.planExplanation,
              estimatedDuration: data.estimatedDuration || pt.estimatedDuration,
              priority: data.priority || pt.priority
            };
          }
          return pt;
        }));

        setChatMessages(prev => prev.map(m => {
          if (m.id === workingId) {
            return {
              ...m,
              text: `✨ I have successfully broken down "${targetTask.title}" into ${data.subtasks?.length || 0} actionable steps. You can view them in your task details!`
            };
          }
          return m;
        }));
      } else {
        throw new Error('Plan API failed');
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.map(m => {
        if (m.id === workingId) {
          return {
            ...m,
            text: `❌ I encountered an issue breaking down the task. However, the task is saved, and you can add steps manually!`
          };
        }
        return m;
      }));
    }
  };

  const handleCancelTaskBreakdown = (messageId: string) => {
    setChatMessages(prev => {
      const cleared = prev.map(m => m.id === messageId ? { ...m, suggestBreakdownTaskId: undefined } : m);
      return [
        ...cleared,
        {
          id: `msg-no-breakdown-${Date.now()}`,
          text: "Understood. Feel free to manage your subtasks manually as you go!",
          sender: 'astra',
          timestamp: new Date().toISOString()
        }
      ];
    });
  };

  // Chat message sending to Astra
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userChatInput.trim() || isChatSending) return;

    const trimmedInput = userChatInput.trim();
    const cleanInput = trimmedInput.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    
    // Direct matches and pattern checking for confirmation phrases
    const directConfirmations = [
      'yes', 'okay', 'sure', 'go ahead', 'ok', 'yep', 'yeah', 'absolutely', 
      'do it', 'sounds good', 'fine', 'please', 'confirm', 'approve', 'add it', 'create it', 'save it', 'go for it'
    ];
    const startingWords = ['yes', 'okay', 'ok', 'sure', 'yeah', 'yep', 'absolutely', 'please', 'confirm'];
    const inputWords = cleanInput.split(/\s+/);
    const isConfirm = directConfirmations.includes(cleanInput) || (inputWords.length <= 4 && startingWords.includes(inputWords[0]));

    // Direct matches and pattern checking for negative/refusal phrases
    const directRefusals = [
      'no', 'cancel', 'dont', 'dont do it', 'stop', 'nevermind', 'no thanks', 'reject', 'decline', 'nope'
    ];
    const isRefusal = directRefusals.includes(cleanInput) || cleanInput.startsWith('no ') || cleanInput === 'no' || cleanInput === 'nope';

    // Find the last suggested task list from Astra that is still active
    const lastAstraMsgWithTasks = [...chatMessages].reverse().find(
      m => m.sender === 'astra' && m.parsedTasks && m.parsedTasks.length > 0
    );

    if (lastAstraMsgWithTasks && isRefusal) {
      const userMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: trimmedInput,
        sender: 'user' as const,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => {
        const cleared = prev.map(m => m.id === lastAstraMsgWithTasks.id ? { ...m, parsedTasks: [] } : m);
        return [
          ...cleared,
          userMsg,
          {
            id: `msg-cancelled-${Date.now()}`,
            text: "❌ Task creation has been cancelled.",
            sender: 'astra',
            timestamp: new Date().toISOString()
          }
        ];
      });
      setUserChatInput('');
      return;
    }

    // Check if there is an active suggestBreakdownTaskId from Astra
    const lastAstraMsgWithBreakdown = [...chatMessages].reverse().find(
      m => m.sender === 'astra' && m.suggestBreakdownTaskId
    );

    if (lastAstraMsgWithBreakdown && isConfirm) {
      const userMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: trimmedInput,
        sender: 'user' as const,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, userMsg]);
      setUserChatInput('');
      
      await handleTriggerTaskBreakdown(lastAstraMsgWithBreakdown.id, lastAstraMsgWithBreakdown.suggestBreakdownTaskId!);
      return;
    }

    if (lastAstraMsgWithTasks && isConfirm) {
      const userMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: trimmedInput,
        sender: 'user' as const,
        timestamp: new Date().toISOString()
      };
      // Append user confirmation and reset input field
      setChatMessages(prev => [...prev, userMsg]);
      setUserChatInput('');
      
      // Auto-approve the suggested tasks immediately
      await handleApproveParsedTasks(lastAstraMsgWithTasks.id, lastAstraMsgWithTasks.parsedTasks);
      return;
    }

    const userMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: trimmedInput,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserChatInput('');
    setIsChatSending(true);

    try {
      const chatHistoryForAPI = [...chatMessages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/astra/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistoryForAPI,
          tasks: tasks,
          userName: profile.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          id: `msg-ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: data.reply,
          sender: 'astra',
          timestamp: new Date().toISOString(),
          parsedTasks: data.parsedTasks && data.parsedTasks.length > 0 ? data.parsedTasks : undefined
        }]);
      } else {
        throw new Error('Chat API response failure');
      }
    } catch (err) {
      console.warn('Chat coach API failed, returning offline serene response', err);
      // High quality offline parsing
      const offlineParsed = (() => {
        const t = userMsg.text.toLowerCase();
        const parsed = [];
        if (t.includes('operating systems exam') || t.includes('operating systems')) {
          parsed.push({ title: "Study Operating Systems", taskType: "Study" as const, deadline: new Date(Date.now() + 86400000).toLocaleDateString('en-CA'), estimatedDuration: 60, priority: "High" as const, verificationMethod: "AI Knowledge Check" });
        }
        if (t.includes('electricity bill') || t.includes('bill')) {
          parsed.push({ title: "Pay Electricity Bill", taskType: "Bills" as const, deadline: new Date(Date.now() + 86400000).toLocaleDateString('en-CA'), estimatedDuration: 15, priority: "Medium" as const, verificationMethod: "Screenshot" });
        }
        if (t.includes('project meeting') || t.includes('meeting')) {
          parsed.push({ title: "Project Meeting", taskType: "Meeting" as const, deadline: new Date().toLocaleDateString('en-CA'), estimatedDuration: 30, priority: "Medium" as const, verificationMethod: "No Verification" });
        }
        if (t.includes('ml assignment') || t.includes('assignment')) {
          parsed.push({ title: "Finish ML Assignment", taskType: "Assignment" as const, deadline: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-CA'), estimatedDuration: 90, priority: "High" as const, verificationMethod: "Document" });
        }
        if (t.includes('dbms tonight') || t.includes('dbms')) {
          parsed.push({ title: "Study DBMS", taskType: "Study" as const, deadline: new Date().toLocaleDateString('en-CA'), estimatedDuration: 60, priority: "High" as const, verificationMethod: "AI Knowledge Check" });
        }
        return parsed;
      })();

      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: `msg-ai-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: offlineParsed.length > 0 
            ? `I've processed your message offline and extracted some focus tasks. Let's review them below!`
            : `I appreciate you sharing that. Even when my cloud connections are offline, I am here as your guide. Let's break down your highest priority task into three simple, actionable steps. Which part would you like to start first?`,
          sender: 'astra',
          timestamp: new Date().toISOString(),
          parsedTasks: offlineParsed.length > 0 ? offlineParsed : undefined
        }]);
      }, 1000);
    } finally {
      setIsChatSending(false);
    }
  };

  // Calculations for dashboard
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(todayStr));
  const filteredHomeTasks = (() => {
    switch (homeTaskFilter) {
      case 'today':
        return tasks.filter(t => t.deadline && t.deadline.startsWith(todayStr));
      case 'pending':
        return tasks.filter(t => t.status === 'Pending');
      case 'completed':
        return tasks.filter(t => t.status === 'Completed');
      default:
        return tasks.filter(t => t.deadline && t.deadline.startsWith(todayStr));
    }
  })();
  const completedTodayTasksCount = todayTasks.filter(t => t.status === 'Completed').length;
  const totalTodayTasksCount = todayTasks.length;
  const todayProgressPercent = totalTodayTasksCount > 0 
    ? Math.round((completedTodayTasksCount / totalTodayTasksCount) * 100) 
    : 0;

  // Upcoming deadlines (Tasks sorted by ascending deadline, excluding today and completed tasks)
  const upcomingDeadlines = tasks
    .filter(t => t.deadline && !t.deadline.startsWith(todayStr) && t.status === 'Pending')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  const levelInfo = getLevelInfo(profile.growthPoints || 0);

  // Dynamic greeting subtitle based on productivity and schedule
  const getGreetingSubtitle = () => {
    const todayTasksList = tasks.filter(t => t.deadline && t.deadline.startsWith(todayStr));
    const pendingTodayList = todayTasksList.filter(t => t.status === 'Pending');
    const completedTodayList = todayTasksList.filter(t => t.status === 'Completed');
    
    if (todayTasksList.length === 0) {
      return "A blank canvas today. Enjoy the spaciousness of a clear schedule! 🍃";
    }
    
    if (pendingTodayList.length === 0 && completedTodayList.length > 0) {
      return "Incredible! You have completed all of today's tasks. Breathe easy! 🎉";
    }
    
    if (completedTodayList.length > 0) {
      return `You're making steady progress! ${completedTodayList.length} of ${todayTasksList.length} tasks completed today. ✨`;
    }
    
    if (profile.streak >= 3) {
      return `Keep your impressive ${profile.streak}-day focus streak alive today! 🔥`;
    }
    
    return `You have ${pendingTodayList.length} focus ${pendingTodayList.length === 1 ? 'task' : 'tasks'} planned for today. 🌿`;
  };

  // Scan all pending intentions for proactive warnings (deadlines, conflicts, heavy workload, missed tasks)
  const getAstraProactiveAlert = () => {
    const pendingTasks = tasks.filter(t => t.status === 'Pending');
    
    // 1. Missed/Overdue tasks
    const missed = pendingTasks.filter(t => t.deadline && t.deadline < todayStr && !t.deadline.startsWith(todayStr));
    if (missed.length > 0) {
      return {
        type: 'missed',
        title: "Overdue/Missed Tasks Detected",
        message: `Astra noticed you have ${missed.length} pending task${missed.length === 1 ? '' : 's'} whose deadlines are in the past. Rescheduling them will bring order and mental peace to your week.`,
        buttonText: "✨ Smart Replanning"
      };
    }

    // 2. High-Risk Deadlines
    const highRisk = pendingTasks.filter(t => t.deadline && t.deadline.startsWith(todayStr) && t.priority === 'High');
    if (highRisk.length > 0) {
      return {
        type: 'risk',
        title: "High-Risk Milestone Today",
        message: `"${highRisk[0].title}" is due today and has high importance. Let's arrange your other tasks sequentially around it to prevent cognitive fatigue.`,
        buttonText: "✨ Balance My Schedule"
      };
    }

    // 3. Heavy Workload
    const todayPending = pendingTasks.filter(t => t.deadline && t.deadline.startsWith(todayStr));
    if (todayPending.length >= 4) {
      return {
        type: 'workload',
        title: "Heavy Workload Cap Detected",
        message: `Managing ${todayPending.length} tasks today might divide your focus. Let's schedule them sequentially to ensure high productivity.`,
        buttonText: "✨ Optimize My Day"
      };
    }

    // 4. Schedule Conflicts
    // If we have multiple tasks with identical recommended schedules (overlapping start times)
    const schedules = todayPending.map(t => t.recommendedSchedule).filter(Boolean);
    const duplicates = schedules.filter((s, idx) => schedules.indexOf(s) !== idx);
    if (duplicates.length > 0) {
      return {
        type: 'conflict',
        title: "Schedule Conflict Detected",
        message: `Multiple tasks have overlapping scheduled slots today. Astra recommends rearranging them sequentially so you can commit 100% of your focus to each.`,
        buttonText: "✨ Resolve Conflicts"
      };
    }

    return null;
  };

  // Select ONE recommended task for "Today's Focus"
  const getTodayFocusTask = (): { task: Task | null; reason: string } => {
    const pendingTasks = tasks.filter(t => t.status === 'Pending');
    if (pendingTasks.length === 0) {
      return { task: null, reason: "All tasks completed! Your schedule is completely clear. Relax or add a new task." };
    }
    
    // 1. High priority tasks today
    const highToday = pendingTasks.find(t => t.deadline && t.deadline.startsWith(todayStr) && t.priority === 'High');
    if (highToday) {
      return { 
        task: highToday, 
        reason: "This is your highest-priority focus for today. Dedicating a quiet session to this now will lift the weight from your afternoon." 
      };
    }
    
    // 2. High priority tasks any day
    const highAny = pendingTasks.find(t => t.priority === 'High');
    if (highAny) {
      return { 
        task: highAny, 
        reason: "Astra recommends tackling this high-priority milestone today to balance your workload and ease upcoming deadlines." 
      };
    }

    // 3. Study / Reading tasks today
    const studyToday = pendingTasks.find(t => t.deadline && t.deadline.startsWith(todayStr) && (t.taskType === 'Study' || t.taskType === 'Reading'));
    if (studyToday) {
      return { 
        task: studyToday, 
        reason: "Active study works best in dedicated deep-focus sessions. Let's approach this task with undivided attention." 
      };
    }

    // 4. Any task scheduled for today
    const todayTask = pendingTasks.find(t => t.deadline && t.deadline.startsWith(todayStr));
    if (todayTask) {
      return { 
        task: todayTask, 
        reason: "This task is scheduled for today. Clearing it will build a productive and satisfying daily momentum." 
      };
    }

    // 5. Default: First pending task in list
    const firstPending = pendingTasks[0];
    return { 
      task: firstPending, 
      reason: "Let's focus on this task next. Proceeding step-by-step is the secret to effortless and stress-free execution." 
    };
  };

  // Local fallback recommendation generator for Astra
  const getLocalAstraRecommendation = (tasksList: Task[]): string => {
    const todayTasks = tasksList.filter(t => t.deadline && t.deadline.startsWith(todayStr));
    const pendingToday = todayTasks.filter(t => t.status === 'Pending');
    const completedToday = todayTasks.filter(t => t.status === 'Completed');
    
    // 1. All tasks today are completed
    if (todayTasks.length > 0 && pendingToday.length === 0) {
      return `Congratulations! You have completed all ${completedToday.length} of today's tasks. Relax and recharge for tomorrow.`;
    }

    // 2. No tasks scheduled for today
    if (todayTasks.length === 0) {
      const upcomingPending = tasksList
        .filter(t => t.status === 'Pending' && t.deadline && t.deadline > todayStr && !t.deadline.startsWith(todayStr))
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

      if (upcomingPending.length > 0) {
        const nextTask = upcomingPending[0];
        return `Your task list is clear today. Tomorrow, you'll work on "${nextTask.title}". Would you like to outline a few steps early to be prepared?`;
      }
      return "Your task list is completely clear today. Would you like to add a new task or rest?";
    }

    // 3. High priority pending task today
    const highPriorityToday = pendingToday.find(t => t.priority === 'High');
    if (highPriorityToday) {
      return `You have a high-priority task today: "${highPriorityToday.title}". Let's protect a dedicated slot to focus on this first. ✨`;
    }

    // 4. Study task pending today
    const studyToday = pendingToday.find(t => t.taskType === 'Study');
    if (studyToday) {
      return `Your study session for "${studyToday.title}" is scheduled. Let's practice active recall to lock in your learnings with calm energy. 🧠`;
    }

    // 5. Multiple tasks pending today
    if (pendingToday.length >= 3) {
      const firstTask = pendingToday[0];
      return `With ${pendingToday.length} tasks scheduled today, starting with "${firstTask.title}" will build productive momentum.`;
    }

    // 6. Single task pending today
    if (pendingToday.length === 1) {
      const singleTask = pendingToday[0];
      return `Just one task scheduled for today: "${singleTask.title}". Give it your full focus to complete it successfully.`;
    }

    // 7. General default pending tasks
    const firstTask = pendingToday[0];
    return `You have ${pendingToday.length} pending task${pendingToday.length === 1 ? '' : 's'} today. Let's start with "${firstTask.title}" to build momentum.`;
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  // Save settings updates
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsName.trim()) {
      setProfile(p => ({
        ...p,
        name: settingsName.trim(),
        streak: Number(settingsStreak) || 0,
        avatarSeed: settingsName.trim().charAt(0).toUpperCase() || 'E'
      }));
      // Display standard alert or visually update
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset your progress and restore default tasks?')) {
      setTasks(DEFAULT_TASKS);
      setProfile(DEFAULT_PROFILE);
      setActivities(DEFAULT_ACTIVITIES);
      setSettingsName(DEFAULT_PROFILE.name);
      setSettingsStreak(DEFAULT_PROFILE.streak);
      // Reload page state safely
    }
  };

  const timeOfDayGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleRescheduleOverdue = (task: Task, reminder?: Reminder) => {
    if (reminder) {
      handleDismissPopupReminder(task.id, reminder.id);
    }
    handleEditTaskClick(task);
  };

  const handleCompleteOverdue = (taskId: string, reminder?: Reminder) => {
    if (reminder) {
      handleDismissPopupReminder(taskId, reminder.id);
    }
    handleToggleComplete(taskId);
  };

  const activeTriggeredReminders = getTriggeredReminders(tasks, currentTime);
  const candidateReminders = activeTriggeredReminders
    .filter(({ reminder }) => !reminder.dismissedPopup && !reminder.read)
    .sort((a, b) => new Date(a.reminder.triggerTime).getTime() - new Date(b.reminder.triggerTime).getTime());

  const dropdownReminders = activeTriggeredReminders.filter(
    ({ reminder }) => reminder.dismissedPopup || reminder.read
  );

  const unreadCount = dropdownReminders.filter(({ reminder }) => !reminder.read).length;

  const shouldShowPopup = !showNotificationsDropdown;
  let activePopupType: 'reminder' | 'overdue' | null = null;
  let activePopupTask: Task | null = null;
  let activePopupReminder: Reminder | null = null;

  if (shouldShowPopup && candidateReminders.length > 0) {
    const activeReminder = candidateReminders[0];
    activePopupTask = activeReminder.task;
    activePopupReminder = activeReminder.reminder;
    activePopupType = activePopupReminder.id.endsWith('-overdue') ? 'overdue' : 'reminder';
  }

  if (showSplashAndAuth) {
    return <SplashAndAuth onAuthComplete={handleAuthComplete} initialUserName={profile.name} />;
  }

  return (
    <div className="min-h-screen bg-forest-bg text-[#2F3E2E] font-sans flex flex-col relative overflow-x-hidden antialiased">
      
      {/* Dynamic Background Leaf / Light Filters */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A7C957]/15 rounded-full blur-3xl -z-10 pointer-events-none ambient-pulse" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-[#4F8A5B]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Header */}
      <header className="w-full max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-[50]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-serif font-black tracking-tight text-[#2F3E2E] flex items-center gap-1">
              🌿 GetItDone
            </span>
            <span className="text-[9px] uppercase tracking-widest bg-[#4F8A5B] text-white px-2 py-0.5 rounded font-black">
              AI Companion
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#2F3E2E]">
            {timeOfDayGreeting()}, {profile.name}.
          </h1>
          <p className="text-[#4F8A5B] font-medium text-sm flex items-center gap-2 mt-0.5">
            <Sparkles className="w-4 h-4 text-[#A7C957]" />
            {getGreetingSubtitle()}
          </p>
        </div>

        {/* Status Indicators in Header */}
        <div className="flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-white/80 shadow-xs w-full md:w-auto">
          {/* XP Progress Indicator */}
          <div className="flex flex-col pr-4 border-r border-[#4F8A5B]/10">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Level & XP</span>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-serif font-black text-[#2F3E2E] text-sm">
                  Level {levelInfo.level}
                </span>
                <span className="text-xs font-bold text-slate-500 font-sans">
                  {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
                </span>
              </div>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-black/5 mt-0.5">
                <div 
                  className="h-full bg-[#A7C957] rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Notification Bell Icon */}
          <div className="relative z-[80]">
            <button
              onClick={() => {
                if (candidateReminders.length > 0) {
                  candidateReminders.forEach(({ task, reminder }) => {
                    handleDismissPopupReminder(task.id, reminder.id);
                  });
                }
                setShowNotificationsDropdown(!showNotificationsDropdown);
              }}
              className="p-2.5 bg-slate-50 hover:bg-[#F6F8F2] rounded-xl border border-slate-100 transition-all cursor-pointer relative flex items-center justify-center shrink-0"
              title="Smart Reminders"
            >
              <Bell className="w-5 h-5 text-[#4F8A5B]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-[80] p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-[#2F3E2E] flex items-center gap-1.5">
                     <Bell className="w-3.5 h-3.5 text-[#4F8A5B]" /> Smart Reminders
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                {dropdownReminders.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-[#4F8A5B]/30 mx-auto mb-2" />
                    No active reminders.
                    <p className="text-[10px] text-slate-400 mt-1">Reminders trigger based on deadline proximity.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {dropdownReminders.map(({ task, reminder }) => (
                      <div 
                        key={reminder.id} 
                        id={`notif-item-${reminder.id}`}
                        className={`border p-2.5 rounded-xl text-left flex flex-col gap-1.5 transition-colors ${
                          reminder.read 
                            ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                            : 'bg-[#F6F8F2]/60 hover:bg-[#F6F8F2] border-[#4F8A5B]/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] uppercase font-bold text-[#4F8A5B]">
                            {task.taskType} Reminder
                          </span>
                          {reminder.read ? (
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-slate-400" /> Read
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-1" />
                          )}
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-[#2F3E2E] leading-tight">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            {reminder.message}
                          </p>
                        </div>
                        
                        <div className="text-[9px] text-slate-400 flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100/50">
                          <span className="flex items-center gap-0.5 font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(reminder.triggerTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(reminder.triggerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {!reminder.read && (
                            <button
                              id={`mark-read-dropdown-${reminder.id}`}
                              onClick={() => handleMarkAsRead(task.id, reminder.id)}
                              className="text-[10px] font-bold text-[#4F8A5B] hover:text-[#3D6B46] bg-[#F6F8F2] hover:bg-[#EAF2EC] px-2 py-1 rounded-lg transition-colors cursor-pointer border-none"
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            id={`open-task-dropdown-${reminder.id}`}
                            onClick={() => handleOpenTaskFromReminder(task, reminder)}
                            className="text-[10px] font-black text-white bg-[#4F8A5B] hover:bg-[#3D6B46] px-2.5 py-1 rounded-lg transition-colors shadow-xs cursor-pointer border-none"
                          >
                            Open Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#2F3E2E]">{profile.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">Streak: {profile.streak} days 🔥</p>
            </div>
            <button
              id="avatar-button"
              onClick={() => setCurrentTab('Profile')}
              className="w-11 h-11 rounded-full bg-[#4F8A5B] border-2 border-white shadow-sm flex items-center justify-center text-white font-bold hover:scale-105 transition-transform cursor-pointer"
            >
              {profile.avatarSeed}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container / Content Switcher */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-10 pb-28">
        <AnimatePresence mode="wait">
          
          {/* HOME TAB */}
          {currentTab === 'Home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in"
            >
              {/* Proactive AI Insight Alert Banner */}
              {(() => {
                const alert = getAstraProactiveAlert();
                if (!alert) return null;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-12 bg-gradient-to-r from-amber-50 to-[#F6F8F2] border-2 border-amber-200/50 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100/75 flex items-center justify-center text-amber-700 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-[#2F3E2E] flex items-center gap-1.5">
                          Astra's Proactive Insight: {alert.title}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPlanMyDayOpen(true)}
                      className="bg-[#2F3E2E] hover:bg-[#4F8A5B] text-white px-5 py-3 rounded-2xl text-xs font-black shadow-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 border-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#A7C957] fill-current" />
                      {alert.buttonText}
                    </button>
                  </motion.div>
                );
              })()}

              {/* Left Column: Today's Tasks */}
              <section className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-white rounded-3xl shadow-xs p-6 md:p-8 flex flex-col border border-white/50 relative overflow-hidden">
                  <div className="flex flex-col gap-5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-serif font-bold text-[#2F3E2E]">Tasks Action Center</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Your primary workspace for completing and verifying tasks</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setPlanMyDayOpen(true)}
                          className="bg-gradient-to-r from-[#4F8A5B] to-[#3E6B48] hover:from-[#3E6B48] hover:to-[#2F3E2E] text-white px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer outline-none border-none"
                        >
                          <span>✨ Plan My Day</span>
                        </button>
                        <span className="text-xs text-[#4F8A5B] font-bold bg-[#F6F8F2] px-3 py-2 rounded-2xl border border-[#4F8A5B]/5">
                          {completedTodayTasksCount} of {totalTodayTasksCount} Today Completed
                        </span>
                      </div>
                    </div>

                    {/* Segmented Filter Tabs */}
                    <div className="flex items-center p-1 bg-[#F6F8F2] rounded-2xl border border-[#4F8A5B]/10">
                      <button
                        onClick={() => setHomeTaskFilter('today')}
                        className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none ${
                          homeTaskFilter === 'today'
                            ? 'bg-white text-[#4F8A5B] shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 bg-transparent'
                        }`}
                      >
                        Today ({tasks.filter(t => t.deadline === todayStr).length})
                      </button>
                      <button
                        onClick={() => setHomeTaskFilter('pending')}
                        className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none ${
                          homeTaskFilter === 'pending'
                            ? 'bg-white text-[#4F8A5B] shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 bg-transparent'
                        }`}
                      >
                        All Pending ({tasks.filter(t => t.status === 'Pending').length})
                      </button>
                      <button
                        onClick={() => setHomeTaskFilter('completed')}
                        className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none ${
                          homeTaskFilter === 'completed'
                            ? 'bg-white text-[#4F8A5B] shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 bg-transparent'
                        }`}
                      >
                        Completed ({tasks.filter(t => t.status === 'Completed').length})
                      </button>
                    </div>
                  </div>

                  {/* Tasks Dynamic List */}
                  <div className={`flex flex-col gap-3 ${filteredHomeTasks.length > 0 ? 'min-h-[250px]' : 'min-h-0'}`}>
                    {filteredHomeTasks.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {filteredHomeTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEditTaskClick}
                            onDelete={handleDeleteTask}
                            onToggleSubtask={handleToggleSubtask}
                            onAddSubtask={handleAddSubtask}
                            onDeleteSubtask={handleDeleteSubtask}
                            isHighlighted={highlightedTaskId === task.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400 bg-[#F6F8F2]/45 rounded-2xl border border-dashed border-[#4F8A5B]/20 p-6"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#EAF2EC] flex items-center justify-center text-[#4F8A5B] mb-3">
                          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        {homeTaskFilter === 'today' && (
                          <>
                            <p className="text-sm font-serif font-bold text-[#2F3E2E]">Your slate is clean today</p>
                            <p className="text-[11px] text-slate-400 max-w-xs mt-1">All tasks completed. Add a new task below whenever you are ready.</p>
                          </>
                        )}
                        {homeTaskFilter === 'pending' && (
                          <>
                            <p className="text-sm font-serif font-bold text-[#2F3E2E]">All pending tasks completed!</p>
                            <p className="text-[11px] text-slate-400 max-w-xs mt-1">You are fully caught up. Add a new task below whenever you are ready.</p>
                          </>
                        )}
                        {homeTaskFilter === 'completed' && (
                          <>
                            <p className="text-sm font-serif font-bold text-[#2F3E2E]">No completed tasks found</p>
                            <p className="text-[11px] text-slate-400 max-w-xs mt-1">Complete your first task to see it listed here with its completed badge.</p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Quick Add Task button */}
                  <div className="mt-6 pt-4 border-t border-slate-50">
                    <button
                      id="quick-add-task-btn"
                      onClick={() => {
                        setEditingTask(null);
                        setTaskModalOpen(true);
                      }}
                      className="w-full py-4 bg-[#F6F8F2] hover:bg-white text-[#4F8A5B] font-bold rounded-2xl border-2 border-dashed border-[#A7C957] hover:border-[#4F8A5B] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-5 h-5 text-[#A7C957] group-hover:text-[#4F8A5B]" />
                      <span>+ Add a New Task</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Column: AI Message, Progress Circle & Deadlines */}
              <section className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Today's Focus Card */}
                <div className="bg-[#4F8A5B] text-white rounded-[32px] p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  {/* Decorative background circle */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-3.5 relative z-10">
                      <span className="text-[10px] uppercase tracking-widest font-black opacity-90 bg-white/15 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#A7C957]" />
                        Today's Focus
                      </span>
                      <button
                        id="open-coaching-chat"
                        onClick={() => setCoachingOpen(true)}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
                        title="Open Coaching Session"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>

                    {(() => {
                      const { task, reason } = getTodayFocusTask();
                      if (task) {
                        return (
                          <div className="space-y-3 relative z-10">
                            <div>
                              <h3 className="text-xl font-serif font-black tracking-tight leading-snug">
                                {task.title}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A7C957] mt-1 bg-white/10 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                {task.estimatedDuration} Minutes
                              </span>
                            </div>

                            <p className="text-xs text-white/85 leading-relaxed bg-black/10 p-3 rounded-2xl border border-white/5 italic">
                              "{reason}"
                            </p>

                            <div className="flex gap-2.5 pt-1.5">
                              <button
                                onClick={() => setActiveFocusTask(task)}
                                className="flex-1 bg-[#A7C957] hover:bg-white hover:text-[#4F8A5B] text-[#2F3E2E] py-3 px-4 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                                Start Focus Session
                              </button>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-3 relative z-10 py-2">
                            <p className="text-sm italic leading-relaxed text-white/90">
                              "{reason}"
                            </p>
                            <button
                              onClick={() => {
                                setEditingTask(null);
                                setTaskModalOpen(true);
                              }}
                              className="mt-2 bg-[#A7C957] text-[#2F3E2E] hover:bg-white hover:text-[#4F8A5B] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Create a New Task
                            </button>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Idea Inbox Card on Home Screen */}
                <button
                  onClick={() => setCurrentTab('Inbox')}
                  className="w-full text-left bg-gradient-to-br from-white to-[#F6F8F2]/30 rounded-[32px] p-6 shadow-xs border border-white/50 relative overflow-hidden group hover:shadow-md hover:border-[#4F8A5B]/25 transition-all cursor-pointer outline-none border-none"
                >
                  <div className="absolute right-4 top-4 w-12 h-12 bg-[#F6F8F2] group-hover:bg-[#4F8A5B]/10 rounded-full flex items-center justify-center text-[#4F8A5B] transition-colors">
                    <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-1.5 max-w-[80%]">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[#4F8A5B] bg-[#EAF2EC] px-2.5 py-1 rounded-full">
                      Quick Thought Safe
                    </span>
                    <h3 className="text-lg font-serif font-bold text-[#2F3E2E] flex items-center gap-1.5 mt-2">
                      ✉️ Idea Inbox
                    </h3>
                    <p className="text-xs text-slate-400">
                      "Dump your ideas. Organize them later."
                    </p>
                    {ideas.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-[#4F8A5B] font-bold pt-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#A7C957] fill-current" />
                        <span>{ideas.length} idea{ideas.length === 1 ? '' : 's'} waiting for Astra sifting</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Progress Summary Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-xs border border-white/50 flex flex-col gap-4 relative overflow-hidden">
                  <h2 className="text-lg font-serif font-bold text-[#2F3E2E]">Progress Summary</h2>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-3xl font-serif font-bold text-[#2F3E2E]">
                        {todayProgressPercent}%
                      </span>
                      <span className="text-xs text-[#6BA368] font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50 self-start">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Today's Focus Rate
                      </span>
                    </div>

                    {/* Circular Chart */}
                    <div className="w-24 h-24 relative flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#F6F8F2" 
                          strokeWidth="10" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#A7C957" 
                          strokeWidth="10" 
                          fill="transparent" 
                          strokeDasharray="251.2" 
                          strokeDashoffset={251.2 - (251.2 * todayProgressPercent) / 100} 
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-black uppercase text-slate-400">
                        Today
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Deadlines Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-xs border border-white/50">
                  <h2 className="text-lg font-serif font-bold text-[#2F3E2E] mb-4">Upcoming Deadlines</h2>
                  
                  {upcomingDeadlines.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingDeadlines.map(task => {
                        const daysLeft = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / 86400000);
                        const isOverdue = daysLeft < 0;
                        
                        let barColor = 'bg-[#A7C957]';
                        if (task.priority === 'High') barColor = 'bg-red-500';
                        else if (task.priority === 'Medium') barColor = 'bg-[#E9C46A]';

                        return (
                          <div key={task.id} className="flex gap-4 items-center p-2 rounded-xl hover:bg-[#F6F8F2]/30 transition-colors">
                            <div className={`w-2 h-10 ${barColor} rounded-full shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#2F3E2E] truncate">{task.title}</p>
                              <p className="text-xs text-slate-400">
                                {isOverdue 
                                  ? 'Overdue' 
                                  : daysLeft === 0 
                                  ? 'Due today' 
                                  : daysLeft === 1 
                                  ? 'Due tomorrow' 
                                  : `Due in ${daysLeft} days`
                                } • {task.taskType}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-6 text-center bg-[#F6F8F2]/25 rounded-2xl border border-dashed border-[#4F8A5B]/15 px-4"
                    >
                      <p className="text-xs font-serif font-bold text-[#2F3E2E]">Complete Tranquility</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">No upcoming pending deadlines are approaching. Feel free to pace yourself mindfully.</p>
                    </motion.div>
                  )}
                </div>



              </section>
            </motion.div>
          )}

          {/* CALENDAR TAB */}
          {currentTab === 'Calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Side: Interactive Month Calendar */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#2F3E2E]">Task Calendar</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Nurture plans through scheduling</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="calendar-prev-month"
                      onClick={handlePrevMonth}
                      className="p-2 hover:bg-[#F6F8F2] rounded-lg transition-colors text-slate-500 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-serif font-bold text-base min-w-[120px] text-center">
                      {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      id="calendar-next-month"
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-[#F6F8F2] rounded-lg transition-colors text-slate-500 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <span key={day} className="text-xs font-bold text-[#4F8A5B] uppercase py-1 tracking-wider">
                      {day}
                    </span>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty cells for padding */}
                  {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square bg-[#F6F8F2]/20 rounded-xl" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, index) => {
                    const dayNum = index + 1;
                    const cellDateStr = new Date(
                      calendarDate.getFullYear(),
                      calendarDate.getMonth(),
                      dayNum
                    ).toLocaleDateString('en-CA');

                    const isSelected = selectedCalendarDateStr === cellDateStr;
                    const isToday = new Date().toLocaleDateString('en-CA') === cellDateStr;
                    const dayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(cellDateStr));
                    const completedDayTasks = dayTasks.filter(t => t.status === 'Completed');
                    const pendingDayTasks = dayTasks.filter(t => t.status === 'Pending');

                    return (
                      <button
                        id={`calendar-day-${dayNum}`}
                        key={dayNum}
                        onClick={() => setSelectedCalendarDateStr(cellDateStr)}
                        className={`aspect-square p-1.5 rounded-xl border flex flex-col justify-between items-center transition-all relative cursor-pointer outline-none ${
                          isSelected 
                            ? 'bg-[#4F8A5B] border-[#4F8A5B] text-white shadow-md shadow-[#4F8A5B]/10 scale-102 font-bold' 
                            : isToday 
                            ? 'bg-[#EAF2EC] border-[#4F8A5B]/30 text-[#4F8A5B] font-bold' 
                            : 'bg-[#F6F8F2]/30 border-slate-100 hover:border-[#4F8A5B]/20 text-[#2F3E2E] hover:bg-[#F6F8F2]/60'
                        }`}
                      >
                        <span className="text-xs md:text-sm">{dayNum}</span>

                        {/* Seed status dots */}
                        {dayTasks.length > 0 && (
                          <div className="flex gap-1 justify-center w-full mt-auto">
                            {pendingDayTasks.map(t => (
                              <span 
                                key={t.id} 
                                className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#E9C46A]'}`} 
                                title="Pending task"
                              />
                            ))}
                            {completedDayTasks.map(t => (
                              <span 
                                key={t.id} 
                                className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#A7C957]' : 'bg-[#4F8A5B]'}`} 
                                title="Completed task"
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Selected Day Tasks */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-white/50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#2F3E2E]">Schedule details</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedCalendarDateStr}</p>
                    </div>
                    <button
                      id="calendar-add-task-btn"
                      onClick={() => {
                        setEditingTask(null);
                        setTaskModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#4F8A5B] hover:bg-[#3E6B48] px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-3 min-h-[220px]">
                    {tasks.filter(t => t.deadline && t.deadline.startsWith(selectedCalendarDateStr)).length > 0 ? (
                      tasks
                        .filter(t => t.deadline && t.deadline.startsWith(selectedCalendarDateStr))
                        .map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEditTaskClick}
                            onDelete={handleDeleteTask}
                            onToggleSubtask={handleToggleSubtask}
                            onAddSubtask={handleAddSubtask}
                            onDeleteSubtask={handleDeleteSubtask}
                            isHighlighted={highlightedTaskId === task.id}
                          />
                        ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 bg-[#F6F8F2]/30 rounded-2xl border border-dashed border-slate-100 p-4">
                        <p className="text-sm font-semibold">No tasks scheduled</p>
                        <p className="text-[11px] text-slate-400 mt-1">A tranquil day. Relax, or add a task for this date.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PROFILE / SETTINGS TAB */}
          {currentTab === 'Profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Profile sub-tab selector */}
              <div className="flex bg-white rounded-2xl p-1.5 border border-slate-100 max-w-sm">
                <button
                  id="subtab-appearance"
                  onClick={() => setProfileSubTab('Appearance')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none ${
                    profileSubTab === 'Appearance'
                      ? 'bg-[#4F8A5B] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#2F3E2E]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Appearance
                </button>
                <button
                  id="subtab-settings"
                  onClick={() => setProfileSubTab('Settings')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none ${
                    profileSubTab === 'Settings'
                      ? 'bg-[#4F8A5B] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#2F3E2E]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </button>
              </div>

              {profileSubTab === 'Appearance' ? (
                <ThemePreviewGallery
                  growthPoints={profile.growthPoints || 0}
                  currentThemeId={profile.currentTheme || 'forest'}
                  onSelectTheme={(themeId) => {
                    setProfile(p => ({ ...p, currentTheme: themeId }));
                  }}
                  levelInfo={levelInfo}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Profile Overview Column */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-white/50 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-24 bg-[#4F8A5B]/10 -z-10" />
                      
                      {/* Large Avatar */}
                      <div className="w-20 h-20 rounded-full bg-[#4F8A5B] text-white font-serif font-black text-3xl mx-auto flex items-center justify-center shadow-md border-4 border-white mt-4">
                        {profile.avatarSeed}
                      </div>

                      <h3 className="text-xl font-serif font-bold text-[#2F3E2E] mt-3">{profile.name}</h3>
                      <p className="text-xs text-slate-400">Productive User since {profile.joinDate}</p>

                      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
                        {/* Stat 1 */}
                        <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5">
                          <span className="text-2xl font-serif font-black text-[#4F8A5B]">
                            {tasks.filter(t => t.status === 'Completed').length}
                          </span>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Tasks Completed</p>
                        </div>

                        {/* Stat 2 */}
                        <div className="bg-[#F6F8F2]/50 p-4 rounded-2xl border border-[#4F8A5B]/5">
                          <span className="text-2xl font-serif font-black text-[#E9C46A] flex items-center justify-center gap-1">
                            {profile.streak} 🔥
                          </span>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Current Streak</p>
                        </div>
                      </div>
                    </div>

                    {/* Assistant description */}
                    <div className="bg-[#4F8A5B] text-[#F6F8F2] rounded-3xl p-6 md:p-8 shadow-xs border border-white/10 relative overflow-hidden">
                      <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#A7C957]/10 rounded-full blur-xl" />
                      <h4 className="font-serif font-bold text-lg mb-2">About Astra</h4>
                      <p className="text-xs leading-relaxed opacity-90 text-justify">
                        Astra is your smart, AI-driven productivity assistant. Designed to help you maintain continuous focus, Astra helps you organize your schedule, prevent procrastination, and execute tasks with maximum clarity and speed.
                      </p>
                    </div>
                  </div>

                  {/* Settings Configuration Column */}
                  <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-white/50">
                    <h3 className="text-lg font-serif font-bold text-[#2F3E2E] mb-6">Astra Settings</h3>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
                          User Name
                        </label>
                        <input
                          id="settings-name-input"
                          type="text"
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 focus:border-[#4F8A5B] rounded-xl px-4 py-2.5 text-sm text-[#2F3E2E] outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#2F3E2E] uppercase tracking-wider mb-1">
                          Adjust Completion Streak (Days)
                        </label>
                        <input
                          id="settings-streak-input"
                          type="number"
                          min="0"
                          value={settingsStreak}
                          onChange={(e) => setSettingsStreak(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#F6F8F2]/50 border border-[#4F8A5B]/10 focus:border-[#4F8A5B] rounded-xl px-4 py-2.5 text-sm text-[#2F3E2E] outline-none transition-all"
                        />
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-slate-50">
                        <button
                          id="save-settings-btn"
                          type="submit"
                          className="flex-1 bg-[#4F8A5B] hover:bg-[#3E6B48] text-white font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer outline-none shadow-md shadow-[#4F8A5B]/10"
                        >
                          Refine Profile
                        </button>
                        <button
                          id="reset-data-btn"
                          type="button"
                          onClick={handleResetData}
                          className="flex-1 bg-red-50 hover:bg-red-150 text-red-600 font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer outline-none flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          Prune Database
                        </button>
                        <button
                          id="logout-btn"
                          type="button"
                          onClick={handleLogout}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer outline-none flex items-center justify-center gap-1.5"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 bg-[#F6F8F2]/40 rounded-2xl p-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[#2F3E2E] mb-2">Astra Features</h5>
                      <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
                        <li>Offline caching via dynamic localStorage keeps your task history safe.</li>
                        <li>Secure proxy handlers maintain confidential Astra conversations.</li>
                        <li>Custom grid layouts keep your tasks organized and structured.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* IDEA INBOX TAB */}
          {currentTab === 'Inbox' && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="animate-fade-in"
            >
              <IdeaInboxView
                ideas={ideas}
                setIdeas={setIdeas}
                onAddTask={handleAddDirectTask}
                userName={profile.name}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent Bottom Navigation - Perfectly match design spec */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around px-4 md:px-20 z-[30] shadow-[0_-4px_20px_rgba(47,62,46,0.05)]">
        {/* Home Tab Trigger */}
        <button
          id="nav-home"
          onClick={() => setCurrentTab('Home')}
          className={`flex flex-col items-center gap-1 cursor-pointer outline-none ${currentTab === 'Home' ? 'text-[#4F8A5B]' : 'opacity-40 hover:opacity-75'} transition-all`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Calendar Tab Trigger */}
        <button
          id="nav-calendar"
          onClick={() => setCurrentTab('Calendar')}
          className={`flex flex-col items-center gap-1 cursor-pointer outline-none ${currentTab === 'Calendar' ? 'text-[#4F8A5B]' : 'opacity-40 hover:opacity-75'} transition-all`}
        >
          <CalendarIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">Calendar</span>
        </button>

        {/* Big Central Floating Plant button */}
        <div className="-mt-12 relative z-[60]">
          <button
            id="nav-add-task-floating"
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="w-16 h-16 bg-[#4F8A5B] hover:bg-[#3E6B48] rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white transform transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none"
            title="Create a new task"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* Idea Inbox Tab Trigger */}
        <button
          id="nav-inbox"
          onClick={() => setCurrentTab('Inbox')}
          className={`flex flex-col items-center gap-1 cursor-pointer outline-none relative ${currentTab === 'Inbox' ? 'text-[#4F8A5B]' : 'opacity-40 hover:opacity-75'} transition-all`}
        >
          <Mail className="w-6 h-6" />
          <span className="text-[10px] font-bold">Idea Inbox</span>
          {ideas.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#A7C957] text-[#2F3E2E] text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
              {ideas.length}
            </span>
          )}
        </button>

        {/* Profile Tab Trigger */}
        <button
          id="nav-profile"
          onClick={() => setCurrentTab('Profile')}
          className={`flex flex-col items-center gap-1 cursor-pointer outline-none ${currentTab === 'Profile' ? 'text-[#4F8A5B]' : 'opacity-40 hover:opacity-75'} transition-all`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

      {/* Task Creation Modal */}
      <AnimatePresence mode="wait">
        {taskModalOpen && (
          <AddEditTaskView 
            taskToEdit={editingTask}
            onSave={handleSaveTask}
            onClose={() => {
              setTaskModalOpen(false);
              setEditingTask(null);
            }}
          />
        )}

        {planningTaskData && (
          <AstraPlanningView
            taskData={planningTaskData}
            onSave={handleSavePlannedTask}
            onClose={() => {
              setPlanningTaskData(null);
              setEditingTask(null);
            }}
            userName={profile.name}
          />
        )}

        {verifyingTask && (
          <TaskVerificationView
            task={verifyingTask}
            onVerified={handleVerificationSuccess}
            onClose={() => setVerifyingTask(null)}
          />
        )}

        {activeFocusTask && (
          <FocusSessionModal
            task={activeFocusTask}
            onClose={() => setActiveFocusTask(null)}
            onComplete={(taskId) => {
              setActiveFocusTask(null);
              const target = tasks.find(t => t.id === taskId);
              if (target) {
                if (target.verificationMethod === 'No Verification') {
                  handleToggleComplete(taskId);
                } else {
                  setVerifyingTask(target);
                }
              }
            }}
          />
        )}

        {planMyDayOpen && (
          <PlanMyDayModal
            tasks={tasks}
            onClose={() => setPlanMyDayOpen(false)}
            onApplyPlan={(updatedTasks) => {
              setTasks(updatedTasks);
              localStorage.setItem('getitdone_tasks', JSON.stringify(updatedTasks));
              setPlanMyDayOpen(false);
              logActivity('edit', "All tasks synchronized by Astra's optimized daily schedule ✨");
              
              // Direct visual notification or elegant golden effect logic
              const sparkleEl = document.createElement('div');
              sparkleEl.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 z-[100] bg-[#A7C957] text-[#2F3E2E] px-6 py-3 rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 border border-white/20 animate-bounce';
              sparkleEl.innerHTML = '✨ Day Roadmap Harmonized Successfully!';
              document.body.appendChild(sparkleEl);
              setTimeout(() => sparkleEl.remove(), 3500);
            }}
          />
        )}

        {pendingReschedule && (
          <GentleCheckInModal
            originalTask={pendingReschedule.originalTask}
            targetDeadline={pendingReschedule.taskData.deadline}
            onAcceptRecommendation={(modified) => {
              const mergedData = {
                ...pendingReschedule.taskData,
                ...modified
              };
              handleConfirmReschedule(mergedData);
            }}
            onContinuePostponing={() => {
              handleConfirmReschedule(pendingReschedule.taskData);
            }}
            onClose={() => setPendingReschedule(null)}
          />
        )}
      </AnimatePresence>

      {/* Astra Chatbot / Coaching Drawer Slider */}
      <AnimatePresence>
        {coachingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2F3E2E]/40 backdrop-blur-xs flex justify-end z-[90]"
          >
            {/* Click-out blocker */}
            <div className="absolute inset-0 -z-10" onClick={() => setCoachingOpen(false)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col relative"
            >
              {/* Drawer Header */}
              <div className="bg-[#4F8A5B] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#A7C957]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base leading-tight">Astra Productivity Coach</h3>
                    <p className="text-[10px] text-white/70">Your Mindful Growth AI Companion</p>
                  </div>
                </div>
                <button
                  id="close-coaching-chat-btn"
                  onClick={() => setCoachingOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Space */}
              <div className="flex-1 p-5 overflow-y-auto bg-[#F6F8F2]/30 space-y-4">
                {chatMessages.map(msg => {
                  const isAstra = msg.sender === 'astra';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isAstra ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isAstra 
                          ? 'bg-white text-[#2F3E2E] shadow-sm border border-slate-100 rounded-tl-none' 
                          : 'bg-[#4F8A5B] text-white rounded-tr-none shadow-sm'
                      }`}>
                        {/* Text formatting with line breaks support */}
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {isAstra && msg.suggestBreakdownTaskId && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-[#4F8A5B]/10">
                            <button
                              type="button"
                              onClick={() => handleTriggerTaskBreakdown(msg.id, msg.suggestBreakdownTaskId!)}
                              className="bg-[#4F8A5B] hover:bg-[#3E6B48] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              Yes, break it down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelTaskBreakdown(msg.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-[#2F3E2E] text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              No, thank you
                            </button>
                          </div>
                        )}
                        
                        {isAstra && msg.parsedTasks && msg.parsedTasks.length > 0 && (
                          <ParsedTasksReviewCard 
                            initialTasks={msg.parsedTasks} 
                            onApprove={(approvedTasks) => handleApproveParsedTasks(msg.id, approvedTasks)}
                            onCancel={() => {
                              setChatMessages(prev => {
                                const updated = prev.map(m => {
                                  if (m.id === msg.id) {
                                    return { ...m, parsedTasks: [] };
                                  }
                                  return m;
                                });
                                return [
                                  ...updated,
                                  {
                                    id: `msg-cancel-${Date.now()}`,
                                    text: "❌ Task creation has been cancelled.",
                                    sender: 'astra',
                                    timestamp: new Date().toISOString()
                                  }
                                ];
                              });
                            }}
                          />
                        )}

                        <span className={`text-[9px] block text-right mt-1.5 ${isAstra ? 'text-slate-400' : 'text-white/60'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isChatSending && (
                  <div className="flex justify-start">
                    <div className="bg-white text-slate-500 shadow-sm border border-slate-100 rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form 
                onSubmit={handleSendChat}
                className="p-4 border-t border-slate-100 flex gap-2 items-center bg-white"
              >
                <input
                  id="chat-user-input"
                  type="text"
                  placeholder="Ask Astra for focus guidance or planning support..."
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  className="flex-1 bg-[#F6F8F2]/60 rounded-xl px-4 py-3 text-sm text-[#2F3E2E] outline-none border border-[#4F8A5B]/10 focus:border-[#4F8A5B] placeholder-slate-400"
                />
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={!userChatInput.trim() || isChatSending}
                  className="p-3 bg-[#4F8A5B] hover:bg-[#3E6B48] disabled:opacity-40 text-white rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Theme Stylesheet Injector */}
      <style dangerouslySetInnerHTML={{ __html: generateThemeCSS(getThemeById(profile.currentTheme || 'forest')) }} />

      {/* New Theme Unlocked Modal */}
      {recentlyUnlockedTheme && (
        <NewThemeUnlockedModal
          theme={recentlyUnlockedTheme}
          onClose={() => setRecentlyUnlockedTheme(null)}
          onApplyTheme={() => {
            setProfile(p => ({ ...p, currentTheme: recentlyUnlockedTheme.id }));
            setRecentlyUnlockedTheme(null);
          }}
        />
      )}

      {/* Real-time In-App Smart Notifications & Overdue Center */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-auto max-w-sm w-full">
        <AnimatePresence>
          {activePopupType === 'reminder' && activePopupTask && activePopupReminder && (
            <motion.div
              key={`reminder-${activePopupReminder.id}`}
              id={`reminder-toast-${activePopupReminder.id}`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="bg-white border border-[#4F8A5B]/15 rounded-2xl shadow-lg p-3.5 flex flex-col gap-2.5 border-l-4 border-l-[#4F8A5B] max-w-xs w-full"
            >
              <div className="flex gap-2.5 items-center">
                <div className="p-1.5 bg-[#F6F8F2] text-[#4F8A5B] rounded-lg flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-[#4F8A5B]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#4F8A5B]">🔔 Reminder</span>
                  <h5 className="text-xs font-semibold text-[#2F3E2E] truncate mt-0.5" title={activePopupTask.title}>
                    {activePopupTask.title}
                  </h5>
                  <p className="text-[10px] font-medium text-amber-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    {getDeadlineTimeRemaining(activePopupTask)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-2">
                <button
                  id={`dismiss-reminder-${activePopupReminder.id}`}
                  onClick={() => handleDismissPopupReminder(activePopupTask!.id, activePopupReminder!.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  id={`open-reminder-${activePopupReminder.id}`}
                  onClick={() => handleOpenTaskFromReminder(activePopupTask!, activePopupReminder!)}
                  className="text-[10px] font-black text-white bg-[#4F8A5B] hover:bg-[#3D6B46] px-3 py-1 rounded-lg transition-all shadow-sm cursor-pointer inline-flex items-center gap-1 border-none"
                >
                  Open Task
                </button>
              </div>
            </motion.div>
          )}

          {activePopupType === 'overdue' && activePopupTask && activePopupReminder && (
            <motion.div
              key={`overdue-${activePopupReminder.id}`}
              id={`overdue-toast-${activePopupReminder.id}`}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="bg-red-50/95 backdrop-blur-xs border border-red-200/50 rounded-2xl shadow-lg p-3.5 flex flex-col gap-2.5 border-l-4 border-l-red-500 max-w-xs w-full"
            >
              <div className="flex gap-2.5 items-center">
                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-red-600">⚠️ Overdue</span>
                  <p className="text-xs font-semibold text-[#2F3E2E] leading-snug mt-0.5">
                    {activePopupReminder.message}
                  </p>
                  <p className="text-[10px] font-bold text-red-800 truncate mt-1" title={activePopupTask.title}>
                    Task: {activePopupTask.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-red-100/50 pt-2 flex-wrap">
                <button
                  id={`dismiss-overdue-${activePopupReminder.id}`}
                  onClick={() => handleDismissPopupReminder(activePopupTask!.id, activePopupReminder!.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  id={`reschedule-overdue-${activePopupTask.id}`}
                  onClick={() => handleRescheduleOverdue(activePopupTask!, activePopupReminder)}
                  className="text-[10px] font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Reschedule
                </button>
                <button
                  id={`complete-overdue-${activePopupTask.id}`}
                  onClick={() => handleCompleteOverdue(activePopupTask!.id, activePopupReminder)}
                  className="text-[10px] font-black text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg transition-all shadow-sm cursor-pointer border-none"
                >
                  Mark Complete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

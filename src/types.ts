/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskType =
  | 'Study'
  | 'Assignment'
  | 'Bills'
  | 'Workout'
  | 'Reading'
  | 'Meeting'
  | 'Shopping'
  | 'Personal'
  | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskStatus = 'Pending' | 'Completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Reminder {
  id: string;
  triggerTime: string;
  message: string;
  frequency: string;
  ignored: boolean;
  dismissedPopup?: boolean;
  read?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  priority: TaskPriority;
  deadline: string; // YYYY-MM-DD
  estimatedDuration: number; // in minutes
  notes?: string;
  status: TaskStatus;
  createdAt: string;
  subtasks?: Subtask[];
  planExplanation?: string;
  recommendedSchedule?: string;
  suggestedCompletionTime?: string;
  whySuggested?: string;
  reminders?: Reminder[];
  quizQuestions?: QuizQuestion[];
  verificationMethod?: string;
  verificationProof?: {
    type: 'quiz' | 'screenshot' | 'document' | 'image' | 'summary';
    textValue?: string;
    fileName?: string;
    verified?: boolean;
    confidence?: number;
    explanation?: string;
  };
}

export interface UserProfile {
  name: string;
  avatarSeed: string; // for custom avatar illustration or letter
  streak: number;
  lastCompletedDate?: string;
  joinDate: string;
  growthPoints?: number;
}

export interface AstraMessage {
  text: string;
  category: 'motivation' | 'peace' | 'focus' | 'nature' | 'mindfulness';
  timestamp: string;
}

export interface RecentActivity {
  id: string;
  type: 'create' | 'complete' | 'delete' | 'edit';
  taskTitle: string;
  timestamp: string;
}

export interface Idea {
  id: string;
  text: string;
  createdAt: string;
}

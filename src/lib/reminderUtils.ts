import { Task, Reminder } from '../types';

/**
 * Returns the parsed Date object for a task's deadline.
 * Handles combined date and time strings (e.g. YYYY-MM-DDTHH:mm).
 * Defaults to 18:00 (6:00 PM) on that deadline date if no time is provided.
 */
export function getTaskDeadlineDate(task: Task): Date {
  if (!task.deadline) {
    // If no deadline, return a date far in the future
    return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
  }

  let datePart = task.deadline;
  let timePart = task.suggestedCompletionTime || '';

  if (task.deadline.includes('T')) {
    const parts = task.deadline.split('T');
    datePart = parts[0];
    timePart = parts[1] || timePart;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  let hours = 18; // Default to 6:00 PM
  let minutes = 0;

  if (timePart) {
    const [h, m] = timePart.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      hours = h;
      minutes = m;
    }
  }

  return new Date(year, month - 1, day, hours, minutes, 0);
}

/**
 * Generates a short, actionable reminder message based on the task and time remaining.
 */
export function getReminderMessage(task: Task, timeText: string, isOverdue?: boolean): string {
  const type = task.taskType;
  const title = task.title;

  if (isOverdue) {
    return `"${title}" is overdue.`;
  }

  // Customize message based on taskType to make it short and actionable
  if (type === 'Workout') {
    return `${title} starts ${timeText}.`;
  } else if (type === 'Study' || type === 'Reading') {
    return `${title} study session starts ${timeText}.`;
  } else if (type === 'Bills') {
    return `${title} is due ${timeText}.`;
  } else if (type === 'Meeting') {
    return `${title} begins ${timeText}.`;
  } else if (type === 'Assignment') {
    return `${title} assignment is due ${timeText}.`;
  } else {
    return `"${title}" is due ${timeText}.`;
  }
}

/**
 * Defines relative offsets before the deadline where reminders should trigger.
 */
interface ReminderConfig {
  id: string;
  offsetMs: number;
  label: string;
  timeText: string;
  isOverdue?: boolean;
}

export const REMINDER_CONFIGS: ReminderConfig[] = [
  // More than 7 days remaining
  { id: '10d', offsetMs: 10 * 24 * 60 * 60 * 1000, label: 'Occasional reminder', timeText: 'in 10 days' },
  
  // Between 2 and 7 days (One reminder each day)
  { id: '7d', offsetMs: 7 * 24 * 60 * 60 * 1000, label: 'Daily reminder', timeText: 'in 7 days' },
  { id: '6d', offsetMs: 6 * 24 * 60 * 60 * 1000, label: 'Daily reminder', timeText: 'in 6 days' },
  { id: '5d', offsetMs: 5 * 24 * 60 * 60 * 1000, label: 'Daily reminder', timeText: 'in 5 days' },
  { id: '4d', offsetMs: 4 * 24 * 60 * 60 * 1000, label: 'Daily reminder', timeText: 'in 4 days' },
  { id: '3d', offsetMs: 3 * 24 * 60 * 60 * 1000, label: 'Daily reminder', timeText: 'in 3 days' },
  { id: '2d', offsetMs: 2 * 24 * 60 * 60 * 1000, label: 'Daily reminder', timeText: 'in 2 days' },
  
  // Within 24 hours (Morning reminder and another reminder later in the day)
  { id: '24h', offsetMs: 24 * 60 * 60 * 1000, label: '24h reminder', timeText: 'in 24 hours' },
  { id: '12h', offsetMs: 12 * 60 * 60 * 1000, label: '12h reminder', timeText: 'in 12 hours' },
  { id: '6h', offsetMs: 6 * 60 * 60 * 1000, label: '6h reminder', timeText: 'in 6 hours' },
  
  // Within 2 hours: Reminder every 30 minutes
  { id: '120m', offsetMs: 120 * 60 * 1000, label: '2h reminder', timeText: 'in 2 hours' },
  { id: '90m', offsetMs: 90 * 60 * 1000, label: '90m reminder', timeText: 'in 90 minutes' },
  { id: '60m', offsetMs: 60 * 60 * 1000, label: '1h reminder', timeText: 'in 1 hour' },
  { id: '30m', offsetMs: 30 * 60 * 1000, label: '30m reminder', timeText: 'in 30 minutes' },
  
  // 10 minutes before
  { id: '10m', offsetMs: 10 * 60 * 1000, label: '10m reminder', timeText: 'in 10 minutes' },
  
  // 5 minutes before
  { id: '5m', offsetMs: 5 * 60 * 1000, label: '5m reminder', timeText: 'in 5 minutes' },

  // Overdue notification (1 second after deadline passes)
  { id: 'overdue', offsetMs: -1000, label: 'Overdue notification', timeText: 'is overdue', isOverdue: true }
];

/**
 * Automatically schedules reminders for a task based on its deadline.
 */
export function generateRemindersForTask(task: Task): Reminder[] {
  if (!task.deadline) return [];

  const deadlineDate = getTaskDeadlineDate(task);
  const deadlineTime = deadlineDate.getTime();
  const createdAtTime = task.createdAt ? new Date(task.createdAt).getTime() : Date.now();

  const reminders: Reminder[] = [];

  REMINDER_CONFIGS.forEach((config) => {
    const triggerTimeMs = deadlineTime - config.offsetMs;

    // Only schedule if the trigger time is after the task was created
    if (triggerTimeMs > createdAtTime) {
      reminders.push({
        id: `rem-${task.id}-${config.id}`,
        triggerTime: new Date(triggerTimeMs).toISOString(),
        message: getReminderMessage(task, config.timeText, config.isOverdue),
        frequency: config.label,
        ignored: false
      });
    }
  });

  return reminders;
}

/**
 * Scans tasks to find all reminders that have triggered up to the current simulated time.
 * Filter out tasks that are completed.
 */
export function getTriggeredReminders(
  tasks: Task[],
  simulatedNow: Date
): Array<{ task: Task; reminder: Reminder }> {
  const triggered: Array<{ task: Task; reminder: Reminder }> = [];
  const simulatedTime = simulatedNow.getTime();

  tasks.forEach(task => {
    // Only generate reminders for pending / unverified tasks
    if (task.status === 'Completed' || (task.verificationProof && task.verificationProof.verified)) {
      return;
    }

    const reminders = task.reminders || [];
    reminders.forEach(reminder => {
      if (reminder.ignored) return;
      const triggerTime = new Date(reminder.triggerTime).getTime();
      if (triggerTime <= simulatedTime) {
        triggered.push({ task, reminder });
      }
    });
  });

  // Sort chronologically (most recently triggered first)
  return triggered.sort((a, b) => {
    return new Date(b.reminder.triggerTime).getTime() - new Date(a.reminder.triggerTime).getTime();
  });
}

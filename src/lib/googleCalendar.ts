import { Task } from '../types';

export interface CalendarEventPayload {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export async function exportTaskToGoogleCalendar(
  task: Partial<Task>,
  accessToken: string
): Promise<boolean> {
  try {
    const title = task.title || 'Untitled Task';
    
    // Construct descriptions
    let descriptionText = `Astra Focus Plan: ${title}\n\n`;
    if (task.description) {
      descriptionText += `Goal: ${task.description}\n`;
    }
    if (task.estimatedDuration) {
      descriptionText += `Estimated Effort: ${task.estimatedDuration} minutes\n`;
    }
    if (task.recommendedSchedule) {
      descriptionText += `Recommended Schedule: ${task.recommendedSchedule}\n\n`;
    }
    if (task.planExplanation) {
      descriptionText += `💡 Astra's Recommendation:\n"${task.planExplanation}"\n\n`;
    }
    if (task.subtasks && task.subtasks.length > 0) {
      descriptionText += `FOCUS SUBTASKS:\n`;
      task.subtasks.forEach((sub) => {
        descriptionText += `[ ] ${sub.title}\n`;
      });
      descriptionText += `\n`;
    }
    
    descriptionText += `Generated via GetItDone`;

    // Construct times. Use deadline as target date.
    const dateStr = task.deadline || new Date().toISOString().split('T')[0];
    
    // Default to starting at 9:00 AM local on the deadline date
    const startDateTime = `${dateStr}T09:00:00`;
    
    // Calculate end time based on estimated duration (default 60 mins)
    const durationMin = task.estimatedDuration || 60;
    const startObj = new Date(startDateTime);
    const endObj = new Date(startObj.getTime() + durationMin * 60000);
    
    // Use ISO string without 'Z' to preserve local timezone, or format properly
    const formatDate = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const payload: CalendarEventPayload = {
      summary: `Focus: ${title}`,
      description: descriptionText,
      start: {
        dateTime: startObj.toISOString(), // Standard ISO format is safest for google API
        timeZone: 'UTC'
      },
      end: {
        dateTime: endObj.toISOString(),
        timeZone: 'UTC'
      }
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API Error:', errorData);
      throw new Error(errorData?.error?.message || 'Failed to export calendar event');
    }

    return true;
  } catch (error) {
    console.error('exportTaskToGoogleCalendar failed:', error);
    throw error;
  }
}

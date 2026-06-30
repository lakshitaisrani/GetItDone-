/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// Fallback messages when Gemini is not configured or fails
const FALLBACK_ASTRA_MESSAGES = [
  {
    text: "Focus on one high-impact task at a time. Multi-tasking decreases overall efficiency and increases stress levels.",
    category: "focus",
  },
  {
    text: "Define clear, actionable criteria for your tasks. Knowing exactly when a task is complete prevents drift and keeps you on track.",
    category: "focus",
  },
  {
    text: "Protect your high-energy hours for demanding analytical work. Move minor tasks to times when your energy naturally dips.",
    category: "productivity",
  },
  {
    text: "Breaking down complex projects into simple daily actions reduces friction and keeps momentum high.",
    category: "planning",
  },
  {
    text: "A quick review of your accomplishments at the end of the day helps calibrate tomorrow's realistic work scope.",
    category: "reflection",
  },
  {
    text: "Scheduled breaks are essential to maintain sustained cognitive performance. Focus on recovery as part of your system.",
    category: "balance",
  },
];

// Helper to get random fallback
function getRandomFallback() {
  return FALLBACK_ASTRA_MESSAGES[Math.floor(Math.random() * FALLBACK_ASTRA_MESSAGES.length)];
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET Astra's Daily Message
app.post('/api/astra/message', async (req, res) => {
  try {
    const { tasks, userName } = req.body;
    
    // Define helper for programmatic contextual recommendations
    const getProgrammaticRecommendation = (tasksList: any[]) => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const todayTasks = tasksList ? tasksList.filter((t: any) => t.deadline === todayStr) : [];
      const pendingToday = todayTasks.filter((t: any) => t.status === 'Pending');
      const completedToday = todayTasks.filter((t: any) => t.status === 'Completed');

      // 1. All tasks today are completed
      if (todayTasks.length > 0 && pendingToday.length === 0) {
        return {
          text: `You have completed all ${completedToday.length} of your scheduled tasks for today. Outstanding work on finishing your agenda!`,
          category: "peace"
        };
      }

      // 2. No tasks scheduled for today
      if (todayTasks.length === 0) {
        const upcomingPending = tasksList ? tasksList
          .filter((t: any) => t.status === 'Pending' && t.deadline > todayStr)
          .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) : [];

        if (upcomingPending.length > 0) {
          const nextTask = upcomingPending[0];
          return {
            text: `Your schedule is clear for today. Your next task is "${nextTask.title}" due on ${nextTask.deadline}. You can prepare steps for it early to stay ahead.`,
            category: "peace"
          };
        }
        return {
          text: "Your schedule is clear today. You can add a new task or review your weekly goals.",
          category: "peace"
        };
      }

      // 3. High priority pending task today
      const highPriorityToday = pendingToday.find((t: any) => t.priority === 'High');
      if (highPriorityToday) {
        return {
          text: `You have a significant, high-priority intention today: "${highPriorityToday.title}". Let's protect a quiet moment to focus on this first. ✨`,
          category: "focus"
        };
      }

      // 4. Study task pending today
      const studyToday = pendingToday.find((t: any) => t.taskType === 'Study');
      if (studyToday) {
        return {
          text: `Your study session for "${studyToday.title}" is scheduled. Let's practice active recall to lock in your learnings with calm energy. 🧠`,
          category: "focus"
        };
      }

      // 5. Multiple tasks pending today
      if (pendingToday.length >= 3) {
        const firstTask = pendingToday[0];
        return {
          text: `You have ${pendingToday.length} tasks scheduled today. Starting with "${firstTask.title}" will help build a highly productive momentum.`,
          category: "motivation"
        };
      }

      // 6. Single task pending today
      if (pendingToday.length === 1) {
        const singleTask = pendingToday[0];
        return {
          text: `You have one task scheduled for today: "${singleTask.title}". Let's focus and get this completed.`,
          category: "mindfulness"
        };
      }

      // 7. General default pending tasks
      const firstTask = pendingToday[0];
      return {
        text: `You have ${pendingToday.length} pending task${pendingToday.length === 1 ? '' : 's'} today. Let's start with "${firstTask.title}" to make progress.`,
        category: "mindfulness"
      };
    };

    const ai = getGeminiClient();

    if (!ai) {
      // Return programmatic contextual recommendation as a fallback
      const recommendation = getProgrammaticRecommendation(tasks);
      return res.json({
        text: recommendation.text,
        category: recommendation.category,
        timestamp: new Date().toISOString(),
        isAi: false,
      });
    }

    const taskCount = tasks ? tasks.length : 0;
    const pendingTasks = tasks ? tasks.filter((t: any) => t.status === 'Pending') : [];
    const pendingCount = pendingTasks.length;

    const prompt = `You are Astra, an intelligent and professional AI productivity assistant. 
The user's name is ${userName || 'Friend'}. 
They currently have ${taskCount} total tasks, and ${pendingCount} are pending/active today.
Here is a list of their pending tasks: ${JSON.stringify(pendingTasks.map((t: any) => ({ title: t.title, type: t.taskType, priority: t.priority, deadline: t.deadline })))}.

Generate a single, short context-aware productivity recommendation (max 2 sentences) for their daily "Astra's Insight" dashboard.
Guidelines:
- Keep the tone clear, actionable, professional, and direct. Do not use motivational speeches or poetic words.
- If they have no tasks scheduled today, generate a message like: "You have no tasks scheduled for today. Would you like to plan your tasks for tomorrow?"
- If they have a busy schedule (3 or more tasks today), generate a message like: "You have ${pendingCount} tasks today. Focus on finishing '${pendingTasks[0]?.title || 'your first task'}' first." or recommend starting with their highest priority task.
- If there is an upcoming deadline in the next few days, generate a message like: "Your task '${pendingTasks[0]?.title || 'upcoming task'}' is approaching. Plan some time today to stay on track."
- Do not use markdown headers, lists, or emojis.
- Choose one of the following categories that fits best: "motivation", "peace", "focus", "planning", "tasks".

Return your output strictly as a JSON object with this exact structure:
{
  "text": "Your message here...",
  "category": "category_name"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      res.json({
        text: parsed.text,
        category: parsed.category,
        timestamp: new Date().toISOString(),
        isAi: true,
      });
    } catch {
      // If parsing fails, clean it up or send fallback
      res.json({
        text: text.replace(/[{}]/g, '').trim(),
        category: 'nature',
        timestamp: new Date().toISOString(),
        isAi: true,
      });
    }
  } catch (error: any) {
    const isTemp = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('temporary') || error?.message?.includes('demand') || error?.message?.includes('UNAVAILABLE');
    if (isTemp) {
      console.log('[GetItDone] Astra message generation: Service temporarily busy or quota limited, returning calm programmatic recommendation.');
    } else {
      console.log('[GetItDone] Astra message generation: Utilizing calm programmatic recommendation.');
    }
    const { tasks } = req.body;
    // Programmatic fallback
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayTasks = tasks ? tasks.filter((t: any) => t.deadline === todayStr) : [];
    const pendingToday = todayTasks.filter((t: any) => t.status === 'Pending');
    let text = "Focus on your tasks today to reach your goals.";
    let category = "focus";
    if (pendingToday.length === 0) {
      text = "You don't have any tasks planned today. Want me to help organize tomorrow?";
      category = "peace";
    } else if (pendingToday.length >= 3) {
      text = `You have ${pendingToday.length} important tasks today. I recommend finishing your ${pendingToday[0].title.toLowerCase()} first.`;
      category = "productivity";
    }
    res.json({
      text,
      category,
      timestamp: new Date().toISOString(),
      isAi: false,
    });
  }
});

// Helper to calculate relative date strings for offline parsing
function getRelativeDateStr(relative: string): string {
  const today = new Date();
  const day = today.getDay();
  if (relative === 'tomorrow') {
    today.setDate(today.getDate() + 1);
  } else if (relative === 'this weekend') {
    const diff = (day === 0) ? 6 : (6 - day); // Saturday
    today.setDate(today.getDate() + diff);
  } else if (relative === 'next monday') {
    const diff = (day === 0) ? 1 : (8 - day);
    today.setDate(today.getDate() + diff);
  } else if (relative === 'friday') {
    const diff = (day <= 5) ? (5 - day) : (12 - day);
    today.setDate(today.getDate() + diff);
  }
  return today.toLocaleDateString('en-CA');
}

// Offline fallback parser for extracting tasks from natural language
function offlineParseTasks(inputText: string): any[] {
  const parsed: any[] = [];
  const text = inputText.toLowerCase();
  
  if (text.includes('operating systems exam') || text.includes('operating systems')) {
    parsed.push({
      title: "Study Operating Systems",
      taskType: "Study",
      deadline: getRelativeDateStr(text.includes('friday') ? 'friday' : 'tomorrow'),
      estimatedDuration: 60,
      priority: "High",
      verificationMethod: "AI Knowledge Check"
    });
  }
  if (text.includes('electricity bill') || text.includes('bill')) {
    parsed.push({
      title: "Pay Electricity Bill",
      taskType: "Bills",
      deadline: getRelativeDateStr('tomorrow'),
      estimatedDuration: 15,
      priority: "Medium",
      verificationMethod: "Screenshot"
    });
  }
  if (text.includes('groceries') || text.includes('buy groceries')) {
    parsed.push({
      title: "Buy Groceries",
      taskType: "Shopping",
      deadline: getRelativeDateStr('this weekend'),
      estimatedDuration: 45,
      priority: "Low",
      verificationMethod: "Short Reflection"
    });
  }
  if (text.includes('project meeting') || text.includes('meeting')) {
    parsed.push({
      title: "Project Meeting",
      taskType: "Meeting",
      deadline: getRelativeDateStr('today'),
      estimatedDuration: 30,
      priority: "Medium",
      verificationMethod: "No Verification"
    });
  }
  if (text.includes('ml assignment') || text.includes('assignment')) {
    parsed.push({
      title: "Finish ML Assignment",
      taskType: "Assignment",
      deadline: getRelativeDateStr('next monday'),
      estimatedDuration: 90,
      priority: "High",
      verificationMethod: "Document"
    });
  }
  if (text.includes('dbms tonight') || text.includes('dbms')) {
    parsed.push({
      title: "Study DBMS",
      taskType: "Study",
      deadline: getRelativeDateStr('today'),
      estimatedDuration: 60,
      priority: "High",
      verificationMethod: "AI Knowledge Check"
    });
  }
  return parsed;
}

// POST Astra Chat / Coaching
app.post('/api/astra/coach', async (req, res) => {
  try {
    const { messages, tasks, userName } = req.body;
    const ai = getGeminiClient();

    const lastUserMessage = messages[messages.length - 1]?.text || 'Hello Astra';

    if (!ai) {
      const parsedTasks = offlineParseTasks(lastUserMessage);
      let reply = `Hello ${userName || 'Friend'}! I am Astra, your smart productivity companion. I'd love to chat with you!`;
      
      if (parsedTasks.length > 0) {
        reply = `I've detected some focus tasks in your message: "${lastUserMessage}". Let's review them below!`;
      } else {
        reply = `Hello ${userName || 'Friend'}! Currently, the AI services are offline or the API key isn't fully active, so I'm running in offline mode. Let's focus on taking a small step forward. Which of your tasks is feeling a bit heavy right now? Let's take it one simple step at a time.`;
      }

      return res.json({
        reply,
        parsedTasks,
        isAi: false,
      });
    }

    // Format the tasks context for the model
    const tasksContext = tasks && tasks.length > 0 
      ? `User's current tasks:\n${tasks.map((t: any) => `- [${t.status}] ${t.title} (${t.taskType}, priority: ${t.priority}, deadline: ${t.deadline})`).join('\n')}`
      : 'User has no tasks added yet.';

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Prepare conversation history
    const systemInstruction = `You are Astra, an AI-powered smart productivity companion and professional task organization agent.
Your primary responsibility is helping the user (whose actual name is '${userName || 'User'}') plan, organize, and complete tasks.
CRITICAL NAME RULE: You MUST refer to the user by their actual name ('${userName || 'User'}') in your messages. NEVER use generic placeholders like 'Friend', 'Gardener', or 'User' in your messages under any circumstances. Always address them by their exact name.

CORE DIRECTIVES:
1. DO NOT behave like a general AI chatbot. Never give poetic, philosophical, or vague motivational responses. Do not offer generic encouragement or soft advice.
2. ALWAYS prioritize helping users take immediate, concrete action. Be concise, highly practical, and action-oriented.
3. If the user's message contains any action, responsibility, deadline, event, or goal, automatically enter TASK CREATION MODE.
   - For example:
     * If the user says "I have to workout tomorrow", respond with: "I've identified a workout task for tomorrow." (NEVER "I appreciate you sharing that with me.")
     * If the user describes something they need to do, say: "I've prepared this task for you. Would you like me to add it to your schedule?" (NEVER "Let's focus on taking one clear productive step.")
   - Extract the tasks and place them in the "parsedTasks" array.
4. Only respond conversationally when the user is explicitly asking for advice or asking a question. Even then, keep it short, concrete, and task-oriented.
5. If multiple tasks are described in a single message, separate them and extract each one of them as a separate task item.
   - For example: "I need to workout tomorrow, study Operating Systems tonight and pay my electricity bill before Friday." -> Generate THREE separate tasks in "parsedTasks".
6. Every user request must be processed independently. Once a task has been created, approved, or cancelled in the conversation history, do not suggest creating it again. Do not reuse previous tasks or mix information from earlier conversations unless the user is explicitly asking to edit or modify an existing task.

Today's date is: ${todayStr} (which is ${todayDayName}). Use this exact reference date to calculate relative deadlines like 'tonight', 'tomorrow', 'Friday', 'next Monday', or 'this weekend'.

For each parsed task in "parsedTasks", specify:
- title (string): descriptive title of the task (e.g., "Workout", "Study Operating Systems", "Pay Electricity Bill", "Project Meeting")
- taskType (string): MUST be one of 'Study', 'Assignment', 'Bills', 'Workout', 'Reading', 'Meeting', 'Shopping', 'Personal', 'Other'
- deadline (string): 'YYYY-MM-DD' formatted deadline calculated relative to ${todayStr}.
- estimatedDuration (number): suggested duration in minutes (e.g., 15 for bills, 30 for meetings, 45 for workouts, 60 for study/reading, 90 for assignments)
- priority (string): MUST be 'Low', 'Medium', or 'High'
- verificationMethod (string): MUST be 'AI Knowledge Check' (for Study), 'Screenshot' (for Bills), 'Document' (for Assignment), 'Image' (for Workout), 'No Verification' (for Meeting), 'Short Reflection' (for Reading, Shopping, Personal, Other)

Return strictly a JSON object with this structure:
{
  "reply": "Your concise, action-oriented response here...",
  "parsedTasks": [
    {
      "title": "Study Operating Systems",
      "taskType": "Study",
      "deadline": "2026-06-29",
      "estimatedDuration": 60,
      "priority": "High",
      "verificationMethod": "AI Knowledge Check"
    }
  ]
}

Context:\n${tasksContext}`;

    // We can use simple chat generation or a simple prompt with chat history
    const historyPrompt = messages.map((m: any) => `${m.sender === 'user' ? 'User' : 'Astra'}: ${m.text}`).join('\n');
    const prompt = `${historyPrompt}\n\nKeep your response concise and action-oriented. Return strictly a JSON object with "reply" and "parsedTasks" fields.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"reply":"", "parsedTasks":[]}');
    res.json({
      reply: parsed.reply || "I've processed your request. Let's make continuous progress!",
      parsedTasks: parsed.parsedTasks || [],
      isAi: true,
    });
  } catch (error: any) {
    const isTemp = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('temporary') || error?.message?.includes('demand') || error?.message?.includes('UNAVAILABLE');
    if (isTemp) {
      console.log('[GetItDone] Astra coaching: Service temporarily busy or quota limited, returning fallback response.');
    } else {
      console.log('[GetItDone] Astra coaching: Returning fallback response.');
    }
    
    // Offline / Error parsing fallback
    const { messages } = req.body;
    const lastUserMessage = messages[messages.length - 1]?.text || '';
    const parsedTasks = offlineParseTasks(lastUserMessage);
    
    res.json({
      reply: parsedTasks.length > 0 
        ? `I've identified ${parsedTasks.length} task${parsedTasks.length === 1 ? '' : 's'} for you. Let's review below.` 
        : "I've prepared this task list for you. Would you like me to add it to your schedule?",
      parsedTasks,
      isAi: false,
    });
  }
});

// POST /api/task/analyze
app.post('/api/task/analyze', async (req, res) => {
  try {
    const { title, description, taskType, priority, deadline, estimatedDuration, notes } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Offline fallback questions based on task type
      let questions = [
        "What is the main objective you want to achieve with this task?",
        "Are there any materials or preparation steps needed beforehand?",
        "What is the biggest potential distraction you'd like Astra to help you avoid?"
      ];

      if (taskType === 'Study') {
        questions = [
          "Which specific topics or chapters are you focusing on today?",
          "Is there an exam or quiz date you are preparing for?",
          "Would you like an active recall quiz at completion to test your retention?"
        ];
      } else if (taskType === 'Assignment') {
        questions = [
          "What is your current progress on this assignment (e.g. outline, half done)?",
          "What is the required submission format or final deliverable?",
          "Is there a reference material or rubric you need to stick to?"
        ];
      } else if (taskType === 'Workout') {
        questions = [
          "What is your primary fitness goal for this session (e.g., strength, cardio, recovery)?",
          "What exercises or routine do you plan to perform?",
          "How will you log your completion (e.g., screenshot of active ring, exercise summary)?"
        ];
      } else if (taskType === 'Bills') {
        questions = [
          "Will you be completing this payment online or offline?",
          "Do you have all the necessary credentials/billing statements ready?",
          "Would you like a confirmation check step to secure peace of mind?"
        ];
      } else if (taskType === 'Reading') {
        questions = [
          "What is the title of the book/document, and which chapters will you read?",
          "Would you like to write a short 2-sentence summary at the end to verify completion?",
          "What key concept or question do you hope to answer through this reading?"
        ];
      }

      return res.json({ questions, isAi: false });
    }

    const prompt = `You are Astra, the supportive, intelligent, and non-judgmental productivity companion.
The user is adding a task:
- Title: "${title}"
- Description: "${description || 'None'}"
- Task Type: "${taskType}"
- Priority: "${priority}"
- Deadline: "${deadline}"
- Duration: ${estimatedDuration} minutes
- Notes: "${notes || 'None'}"

Generate exactly 3 deep, highly intelligent, encouraging follow-up questions to ask the user before planning this task.
- Tailor the questions specifically to the task details and the task type (${taskType}).
- Focus on clarifying the scope, understanding potential hurdles, setting specific study topics, or identifying the main deliverable.
- Keep the questions brief, warm, nature-inspired, and simple to answer (maximum 1 sentence per question).
- Avoid generic productivity jargon; sound like a peaceful coach.

Return the response strictly as a JSON object with this format:
{
  "questions": [
    "Question 1 here?",
    "Question 2 here?",
    "Question 3 here?"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"questions":[]}');
    res.json({ questions: parsed.questions, isAi: true });
  } catch (error: any) {
    const isTemp = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('temporary') || error?.message?.includes('demand') || error?.message?.includes('UNAVAILABLE');
    if (isTemp) {
      console.log('[GetItDone] Task analysis: Service temporarily busy or quota limited, returning default questions.');
    } else {
      console.log('[GetItDone] Task analysis: Returning default questions.');
    }
    res.json({
      questions: [
        "What is your main target for this task?",
        "Are there any blockers you foresee?",
        "How will you reward yourself after completion?"
      ],
      isAi: false,
    });
  }
});

// Auto verification method decider on server
function getAutoVerificationMethodServer(taskType: string, title: string = ''): string {
  const t = taskType;
  const titleLower = title.toLowerCase();

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

  if (t === 'Shopping' || t === 'Personal' || t === 'Other') {
    return 'Short Reflection';
  }
  return 'Short Reflection';
}

// POST /api/task/plan
app.post('/api/task/plan', async (req, res) => {
  const { task, answers, generateSubtasks } = req.body;
  const shouldGenerateSubtasks = generateSubtasks === true;

  try {
    const ai = getGeminiClient();
    const autoVerification = getAutoVerificationMethodServer(task.taskType, task.title);

    const formattedAnswers = Object.entries(answers || {})
      .map(([q, a]) => `Question: "${q}"\nAnswer: "${a}"`)
      .join('\n\n');

    if (!ai) {
      // Offline fallback plan generator with specific study tasks
      let mockSubtasks: any[] = [];
      if (shouldGenerateSubtasks) {
        mockSubtasks = [
          { title: `Review initial requirements for "${task.title}"` },
          { title: `Execute core work for "${task.title}" step-by-step` },
          { title: "Perform final quality checks and verification" },
        ];

        if (task.taskType === 'Study') {
          const hasTopics = task.notes || task.description;
          mockSubtasks = [
            { title: `Review the selected topics${hasTopics ? ` in ${hasTopics.substring(0, 30)}` : ''}` },
            { title: "Revise important concepts and terminology" },
            { title: "Solve practice questions and self-test" },
            { title: "Complete the Knowledge Check" }
          ];
        }
      }
      
      return res.json({
        subtasks: mockSubtasks.map((s, idx) => ({
          id: `s-${idx}-${Date.now()}`,
          title: s.title,
          completed: false
        })),
        estimatedDuration: task.estimatedDuration || 30,
        recommendedSchedule: `Best completed during a quiet block today.`,
        priority: task.priority || "Medium",
        verificationMethod: autoVerification,
        planExplanation: `We've structured this plan to help you progress steadily. Take it one milestone at a time!`,
        reminders: [
          {
            id: 'r1',
            triggerTime: "Mid-way to deadline",
            message: `How is "${task.title}" going? Remember to focus on your core objectives.`,
            frequency: task.priority === 'High' ? "Every 4 hours" : "Once a day",
            ignored: false
          }
        ],
        isAi: false
      });
    }

    const subtasksPromptInstruction = shouldGenerateSubtasks
      ? `1. Subtasks: A list of 3-5 logical, bite-sized, actionable, and specific subtasks to accomplish this task.
   CRITICAL GUIDELINES FOR STUDY TASKS:
   - If TaskType is "Study", you MUST generate a practical study-specific plan (e.g. "Review today's topics", "Revise important concepts", "Solve practice questions", "Complete Knowledge Check").
   - If the user provides study topics anywhere (notes, answers, description, etc.), generate specific subtasks based directly on those topics (e.g. if a topic is "Process Synchronization", subtasks should mention Process Synchronization).
   - You are STRICTLY FORBIDDEN from generating generic or filler subtasks such as "Focus deeply", "Prepare workspace", "Celebrate progress", "Sit in a quiet space", "Quiet your mind", or similar.
   - All subtasks MUST directly relate to active learning, reviewing, revising, or practicing.`
      : `1. Subtasks: Since this is a regular task or the user has chosen to manage subtasks manually, you MUST NOT generate any subtasks. Return strictly an empty array \`[]\` for the "subtasks" field.`;

    const prompt = `You are Astra, a smart and professional productivity coach.
Create a highly focused, clear plan and summary for this task:
- Title: "${task.title}"
- Description: "${task.description || 'None'}"
- TaskType: "${task.taskType}"
- Priority: "${task.priority}"
- Deadline: "${task.deadline}"
- Estimated Duration: ${task.estimatedDuration || 30} minutes
- Notes: "${task.notes || 'None'}"

${formattedAnswers ? `Here is additional context from the user:\n${formattedAnswers}\n` : ''}
Generate:
${subtasksPromptInstruction}
2. Estimated Duration: Suggest the most optimal duration in minutes (as a whole integer number, e.g., 45, 60, 90) representing the total time needed. Base this on the task complexity, but stay close to the user's original estimate of ${task.estimatedDuration || 30} minutes unless you feel it's highly unrealistic.
3. Recommended Schedule / Start Time: Suggest a specific start time or time block (e.g., "Today at 2:00 PM", "Tomorrow morning at 9:00 AM", "This evening at 6:00 PM").
4. Suggested Completion Time: Suggest a specific completion time or time block.
5. Difficulty / Priority: Suggest the recommended difficulty/priority level for this task ("Low", "Medium", "High"). It must be one of these exact three strings.
6. Why Suggested: Provide a simple, clear rationale starting with 'Why I suggested this' based on deadline and effort.
7. Plan Explanation: Provide a direct, simple coaching sentence on how to approach the task professionally with clear focus, without any gardening, forest, or poetic references.

Return your response strictly as a JSON object with this exact structure (do not include markdown wrapping inside the text, just standard text):
{
  "subtasks": [
    { "title": "Subtask title here..." }
  ],
  "estimatedDuration": 45,
  "recommendedSchedule": "Suggested start time/schedule here...",
  "suggestedCompletionTime": "Suggested completion time here...",
  "priority": "Medium",
  "whySuggested": "Why I suggested this: Because this is...",
  "planExplanation": "A short coaching explanation of the plan..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Format subtasks with IDs if returned
    const subtasks = (parsed.subtasks || []).map((sub: any, idx: number) => ({
      id: `s-${idx}-${Date.now()}`,
      title: sub.title,
      completed: false
    }));

    res.json({
      subtasks: shouldGenerateSubtasks ? subtasks : [],
      estimatedDuration: parsed.estimatedDuration || task.estimatedDuration || 30,
      recommendedSchedule: parsed.recommendedSchedule || "Today at an optimal hour",
      suggestedCompletionTime: parsed.suggestedCompletionTime || "Today by the end of the focus block",
      priority: parsed.priority || task.priority || "Medium",
      whySuggested: parsed.whySuggested || "Why I suggested this: This schedule balances your current load with the task's complexity.",
      verificationMethod: autoVerification,
      planExplanation: parsed.planExplanation || "We broke this down to organize your work without overwhelm.",
      reminders: [
        {
          id: `r-0-${Date.now()}`,
          triggerTime: "Mid-way to deadline",
          message: `Just checking in on "${task.title}"! Remember to break it down and tackle it step by step.`,
          frequency: "Once a day",
          ignored: false
        }
      ],
      isAi: true
    });
  } catch (error: any) {
    console.log('[GetItDone] Task plan generation: Returning structured fallback plan.');
    const autoVerification = getAutoVerificationMethodServer(task.taskType, task.title);
    res.json({
      subtasks: shouldGenerateSubtasks ? [
        { id: `s-1-${Date.now()}`, title: `Review initial requirements for "${task.title}"`, completed: false },
        { id: `s-2-${Date.now()}`, title: `Execute core work for "${task.title}"`, completed: false },
        { id: `s-3-${Date.now()}`, title: `Perform final quality checks and verification`, completed: false }
      ] : [],
      estimatedDuration: task.estimatedDuration || 30,
      recommendedSchedule: `Best executed during a quiet block today.`,
      suggestedCompletionTime: `Today 45 minutes after start.`,
      priority: task.priority || "Medium",
      whySuggested: `Why I suggested this: This structured approach protects your schedule and ensures you hit your milestone successfully.`,
      verificationMethod: autoVerification,
      planExplanation: `By breaking this down into simple steps, we protect your focus and ensure you hit your milestone successfully.`,
      reminders: [
        {
          id: `r-1-${Date.now()}`,
          triggerTime: "Mid-way to deadline",
          message: `Just checking in on "${task.title}"! Remember to take things one step at a time.`,
          frequency: "Once a day",
          ignored: false
        }
      ],
      isAi: false
    });
  }
});

// POST /api/astra/plan-my-day
function generateProgrammaticDailyPlan(pendingTasks: any[]) {
  const optimizedTasks = pendingTasks.map((t: any, idx: number) => {
    const startHour = 9 + idx * 2;
    const startStr = `${startHour > 12 ? startHour - 12 : startHour}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;
    const duration = t.estimatedDuration || 30;
    const endHour = startHour + Math.floor(duration / 60);
    const endMin = duration % 60;
    const endStr = `${endHour > 12 ? endHour - 12 : endHour}:${endMin.toString().padStart(2, '0')} ${endHour >= 12 ? 'PM' : 'AM'}`;
    
    return {
      id: t.id,
      recommendedSchedule: `Today at ${startStr}`,
      suggestedCompletionTime: `Today by ${endStr}`
    };
  });

  const insights = [];
  if (pendingTasks.length >= 4) {
    insights.push({
      type: "workload",
      title: "Heavy Workload Detected",
      description: "Scheduling 4 or more tasks today can lead to overload. We've paced them with generous 2-hour breathing blocks."
    });
  }
  
  const highPriorityTasks = pendingTasks.filter((t: any) => t.priority === 'High');
  if (highPriorityTasks.length > 1) {
    insights.push({
      type: "conflict",
      title: "Schedule Conflict Resolved",
      description: `Multiple high-priority focus milestones were scheduled. We have prioritized "${highPriorityTasks[0].title}" first to avoid attention division.`
    });
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const overdueTasks = pendingTasks.filter((t: any) => t.deadline && t.deadline < todayStr);
  if (overdueTasks.length > 0) {
    insights.push({
      type: "risk",
      title: "Rescheduled Overdue Tasks",
      description: `We noticed ${overdueTasks.length} pending task${overdueTasks.length === 1 ? '' : 's'} with past deadlines. Astra has integrated them into today's schedule.`
    });
  }

  return {
    tasks: optimizedTasks,
    whySuggested: `Why I suggested this: By organizing your tasks with clear, non-overlapping windows and prioritizing high-priority tasks first, we protect your focus from scattered fatigue.`,
    insights,
    isAi: false
  };
}

app.post('/api/astra/plan-my-day', async (req, res) => {
  const { tasks } = req.body;
  try {
    const ai = getGeminiClient();
    const pendingTasks = (tasks || []).filter((t: any) => t.status === 'Pending');

    if (pendingTasks.length === 0) {
      return res.json({
        tasks: [],
        whySuggested: "Why I suggested this: You have no active pending tasks right now, so your schedule is perfectly clear! Enjoy this moment.",
        insights: [],
        isAi: false
      });
    }

    if (!ai) {
      return res.json(generateProgrammaticDailyPlan(pendingTasks));
    }

    const taskDetails = pendingTasks.map((t: any) => 
      `- ID: "${t.id}", Title: "${t.title}", Priority: "${t.priority}", Estimated Duration: ${t.estimatedDuration || 30} mins, Deadline: "${t.deadline}"`
    ).join('\n');

    const prompt = `You are Astra, a smart and professional productivity coach.
Analyze this list of pending focus tasks:
${taskDetails}

Check for unrealistic deadlines, schedule conflicts, heavy workload (e.g., more than 3 high-intensity tasks), or high-risk deadlines.
Generate:
1. An optimized daily schedule mapping out conflict-free, serene Recommended Start Times ("recommendedSchedule") and Suggested Completion Times ("suggestedCompletionTime") for each task.
2. A general "whySuggested" text describing your overall daily planning rationale.
3. An array of "insights" representing detected risks or alerts (e.g. workload capacity, priority sequencing, schedule clashes) that you resolved.

Return strictly a JSON object with this structure:
{
  "tasks": [
    { "id": "task_id_here", "recommendedSchedule": "Today at 9:00 AM", "suggestedCompletionTime": "Today by 9:45 AM" }
  ],
  "whySuggested": "Why I suggested this: ...",
  "insights": [
    { "type": "workload" or "conflict" or "risk" or "missed", "title": "Insight Title", "description": "Insight description here..." }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      tasks: parsed.tasks || [],
      whySuggested: parsed.whySuggested || "Why I suggested this: Balanced pacing prevents cognitive fatigue.",
      insights: parsed.insights || [],
      isAi: true
    });

  } catch (error) {
    console.log('[GetItDone] Plan My Day calculation: Returning structured fallback plan.');
    const pendingTasks = (tasks || []).filter((t: any) => t.status === 'Pending');
    res.json(generateProgrammaticDailyPlan(pendingTasks));
  }
});

// Helper to parse data URL into Gemini inlineData format
function parseDataUrl(dataUrl: string) {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

// POST /api/task/verify-completion
app.post('/api/task/verify-completion', async (req, res) => {
  try {
    const { task, proofType, textValue, fileName, uploadedFileBase64, beforeImageBase64, afterImageBase64 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Offline fallback verification
      return res.json({
        verified: true,
        confidence: 90,
        explanation: "Offline validation: Your self-verification has been registered. This task has been marked complete! 🌿",
        isAi: false
      });
    }

    const imageParts: any[] = [];
    if (uploadedFileBase64) {
      const parsed = parseDataUrl(uploadedFileBase64);
      if (parsed) {
        imageParts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          }
        });
      }
    }
    if (beforeImageBase64) {
      const parsed = parseDataUrl(beforeImageBase64);
      if (parsed) {
        imageParts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          }
        });
      }
    }
    if (afterImageBase64) {
      const parsed = parseDataUrl(afterImageBase64);
      if (parsed) {
        imageParts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          }
        });
      }
    }

    const prompt = `You are Astra, a smart and professional AI productivity coach.
Evaluate the user's proof of completion for the following task:
- Task Title: "${task.title}"
- Description: "${task.description || 'None'}"
- Task Type: "${task.taskType}"

The user selected proof method: "${proofType}"
- Submitted Proof text / answers / summary: "${textValue || 'None'}"
- File name uploaded: "${fileName || 'None'}"

${imageParts.length > 0 ? `The user has provided ${imageParts.length} image file(s) as visual proof. Analyze this visual proof carefully.` : ''}

Evaluate if the submitted proof is sincere and matches the context of the task:
1. If the proofType is "summary" or "reflection", verify that the user wrote a relevant, meaningful sentence or summary regarding the task.
2. If the proofType is "image" or related visual upload (like for Workout, Cleaning, or physical tasks) and an image is provided:
   - Check if the image content is genuinely relevant to the task.
   - For Workout tasks:
     * ACCEPT examples showing: gym environment, exercise equipment, running or walking activity, fitness tracker workout summary, exercise in progress, athletic gear or active sportswear.
     * STRICTLY REJECT examples showing: random selfies, portraits unrelated to exercise, food, generic landscapes, pets, documents, or internet memes.
   - For other tasks (Cleaning, Bills, etc.):
     * Apply the same strict relevance checking. It must depict realistic proof of the task (e.g., clean dishes, clean workspace, actual receipt or transaction confirmation screen).
   - If confidence is too low, or if the image is irrelevant (such as an internet meme, random scenery, plain blank color block), you MUST set "verified" to false and politely explain why they should upload genuine proof.
3. If the input is completely empty or junk like "asd", return verified: false with a soft, warm request for a genuine reflection.
4. Your evaluation must be supportive and never cynical, but only verify when there is reasonable evidence that the task was completed.

Return strictly a JSON object with this structure:
{
  "verified": true, // or false
  "confidence": 95, // 0 to 100 percentage
  "explanation": "A clear, encouraging, professional explanation of why their proof succeeds, or why it was rejected and what to upload instead."
}`;

    const contents: any[] = [];
    if (imageParts.length > 0) {
      contents.push(...imageParts);
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      verified: typeof parsed.verified === 'boolean' ? parsed.verified : true,
      confidence: parsed.confidence || 95,
      explanation: parsed.explanation || "Your reflection is clear and complete. Task marked as done!",
      isAi: true
    });
  } catch (error: any) {
    const isTemp = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('temporary') || error?.message?.includes('demand') || error?.message?.includes('UNAVAILABLE');
    if (isTemp) {
      console.log('[GetItDone] Verification: Service temporarily busy or quota limited, returning offline validation.');
    } else {
      console.log('[GetItDone] Verification: Returning offline validation.');
    }
    res.json({
      verified: true,
      confidence: 85,
      explanation: "The verification service is offline, but your task has been successfully marked as completed. 🌿",
      isAi: false
    });
  }
});

// POST /api/astra/weekly-reflection
app.post('/api/astra/weekly-reflection', async (req, res) => {
  try {
    const { tasks, userName, streak, growthPoints } = req.body;
    const ai = getGeminiClient();

    const completedTasks = (tasks || []).filter((t: any) => t.status === 'Completed');
    const totalCompleted = completedTasks.length;
    
    // Fallback if no Gemini client
    if (!ai) {
      return res.json({
        summary: `What a highly productive week, ${userName || 'Friend'}! You successfully completed ${totalCompleted} task(s), keeping your momentum streak of ${streak || 0} days alive. Your steady focus is highly effective in driving continuous progress.`,
        growthPoints: growthPoints || 0,
        suggestions: [
          "Continue allocating focused morning blocks for high-priority tasks.",
          "Clear away minor distractions to optimize your focus workflow.",
          "Ensure you schedule short strategic breaks during longer work sessions to maintain focus."
        ],
        isAi: false
      });
    }

    const prompt = `You are Astra, a smart and professional AI productivity coach.
Analyze the user's weekly productivity and generate a clear, professional, and encouraging "Weekly Reflection":
- User Name: "${userName || 'Friend'}"
- Current Streak: ${streak || 0} days
- Total Growth Points: ${growthPoints || 0} GP
- Total Completed Tasks: ${totalCompleted}
- Completed Tasks Details: ${JSON.stringify(completedTasks.map((t: any) => ({ title: t.title, type: t.taskType, priority: t.priority })))}

Task Analysis Guidelines:
1. Provide a highly encouraging, clearly written summary (3-4 sentences max) of their achievements. Celebrate their consistency and focus on high-impact outcomes.
2. Formulate 3 distinct, practical, highly actionable personalized suggestions for the upcoming week based on their productivity patterns. Make them sound supportive and professional.

Return your response strictly as a JSON object with this structure:
{
  "summary": "Your encouraging summary here...",
  "suggestions": [
    "Suggestion 1...",
    "Suggestion 2...",
    "Suggestion 3..."
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      summary: parsed.summary || `You have made excellent progress on your goals this week!`,
      suggestions: parsed.suggestions || [
        "Tackle larger high-priority tasks in quiet morning sessions.",
        "Review your pending tasks between transitions.",
        "Keep your momentum active with one simple task tomorrow."
      ],
      isAi: true
    });
  } catch (error: any) {
    const isTemp = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('temporary') || error?.message?.includes('demand') || error?.message?.includes('UNAVAILABLE');
    if (isTemp) {
      console.log('[GetItDone] Weekly reflection: Service temporarily busy or quota limited, returning offline reflection.');
    } else {
      console.log('[GetItDone] Weekly reflection: Returning offline reflection.');
    }
    res.json({
      summary: `You are managing your productivity wonderfully! Each completed task is a step towards your future goals.`,
      suggestions: [
        "Begin your week with a low-priority task to ease into focus.",
        "Review your study materials before complex tasks.",
        "Align your daily deadlines with your natural energy peaks."
      ],
      isAi: false
    });
  }
});

// POST /api/study/verify-explanation
app.post('/api/study/verify-explanation', async (req, res) => {
  const { task, subject, topics, explanation } = req.body;
  const currentSubject = subject || task?.title || 'Study Subject';
  const currentTopics = topics || 'various topics';
  const userExplanation = explanation || '';

  try {
    const ai = getGeminiClient();

    if (!ai) {
      // Robust offline fallback validation
      const explanationLength = userExplanation.trim().length;
      if (explanationLength < 30) {
        return res.json({
          verified: false,
          confidence: 100,
          explanation: "I couldn't confidently verify your study session yet. Try explaining one of the topics in a little more detail."
        });
      }

      return res.json({
        verified: true,
        confidence: 100,
        explanation: `✅ Study Verified. (Astra's Offline Mode) Thank you for reflecting on "${currentSubject}". Explaining concepts like "${currentTopics}" in your own words is a wonderful way to lock in your understanding. Keep up the amazing work! 🌿`
      });
    }

    const prompt = `You are Astra, the serene, supportive, and nurturing AI companion for a productivity and focus application called GetItDone.
Your task is to evaluate the student's study reflection and concept explanation.

The student completed a study session:
- Subject: "${currentSubject}"
- Topics covered: "${currentTopics}"
- Explanation provided: "${userExplanation}"

Your Evaluation Criteria:
1. Is the explanation relevant to the selected subject ("${currentSubject}")?
2. Does it reference or relate to the topics entered ("${currentTopics}")?
3. Does it demonstrate a reasonable conceptual understanding (do not judge perfect academic accuracy; we encourage genuine study and meaningful reflection)?
4. Is it written in the user's own words (not empty, not single words, and not pure gibberish)?

If the response is extremely vague, completely unrelated to the subject/topics, or too brief to show reflection:
- Set "verified" to false
- Set "explanation" to EXACTLY: "I couldn't confidently verify your study session yet. Try explaining one of the topics in a little more detail."

Otherwise, if it passes these relaxed and encouraging criteria:
- Set "verified" to true
- Set "explanation" to a short, nurturing, supportive 2-3 sentence overview starting with "✅ Study Verified. " and celebrating their learned concepts with mindful positivity.

Return strictly a JSON response matching this schema:
{
  "verified": boolean,
  "explanation": "Your feedback string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING }
          },
          required: ["verified", "explanation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"verified":false,"explanation":""}');
    res.json({
      verified: parsed.verified,
      confidence: 100,
      explanation: parsed.explanation || (parsed.verified 
        ? `✅ Study Verified. Wonderful explanation of "${currentTopics}". Explaining concepts in your own words is a powerful way to reinforce your understanding.`
        : "I couldn't confidently verify your study session yet. Try explaining one of the topics in a little more detail.")
    });
  } catch (error: any) {
    console.error('[GetItDone] Study explanation verification error:', error);
    // Graceful fallback on error
    const explanationLength = userExplanation.trim().length;
    if (explanationLength < 30) {
      res.json({
        verified: false,
        confidence: 100,
        explanation: "I couldn't confidently verify your study session yet. Try explaining one of the topics in a little more detail."
      });
    } else {
      res.json({
        verified: true,
        confidence: 100,
        explanation: `✅ Study Verified. Thank you for reflecting on "${currentSubject}" and explaining "${currentTopics}" in your own words. Your commitment to mindful growth is inspiring! 🌿`
      });
    }
  }
});

function getProgrammaticIdeaSuggestions(ideas: any[]) {
  return ideas.map((idea, index) => {
    const text = idea.text || '';
    const textLower = text.toLowerCase();
    
    let suggestionType = 'Task';
    let suggestedTitle = text;
    let suggestedDescription = `Organized thought from your Idea Inbox.`;
    let taskType = 'Personal';
    let priority = 'Medium';
    let estimatedDuration = 30;
    let subtasks = ['Prepare requirements', 'Execute key tasks', 'Verify results'];
    let explanation = `Programmatic organization: Let's turn this thought into an action.`;

    // 1. Study Session / Academic keywords
    if (textLower.includes('study') || textLower.includes('exam') || textLower.includes('learn') || textLower.includes('revise') || textLower.includes('class') || textLower.includes('lecture') || textLower.includes('read') || textLower.includes('book') || textLower.includes('operating systems')) {
      suggestionType = 'Study Session';
      taskType = 'Study';
      suggestedTitle = text.length > 40 ? `${text.substring(0, 37)}...` : text;
      suggestedDescription = `Study session focused on: ${text}`;
      estimatedDuration = 45;
      subtasks = ['Review lecture notes & core slides 📚', 'Practice active recall questions', 'Do a brief summary reflection'];
      explanation = `Acquiring new knowledge is key to professional growth. Let's build your understanding. 🧠`;
    }
    // 2. Shopping keywords
    else if (textLower.includes('buy') || textLower.includes('shop') || textLower.includes('grocery') || textLower.includes('groceries') || textLower.includes('get') || textLower.includes('store') || textLower.includes('purchase') || textLower.includes('gift') || textLower.includes('birthday')) {
      suggestionType = 'Shopping Item';
      taskType = 'Shopping';
      suggestedTitle = text.length > 40 ? `${text.substring(0, 37)}...` : text;
      suggestedDescription = `Shopping intention: ${text}`;
      estimatedDuration = 20;
      subtasks = ['Check current inventory and items list 🛒', 'Go to the store or locate online', 'Purchase and organize in pantry'];
      explanation = `Fulfilling shopping tasks ensures you have necessary items. 🍎`;
    }
    // 3. Meeting keywords
    else if (textLower.includes('meet') || textLower.includes('email') || textLower.includes('call') || textLower.includes('talk') || textLower.includes('zoom') || textLower.includes('discuss') || textLower.includes('professor') || textLower.includes('colleague') || textLower.includes('friend')) {
      suggestionType = 'Meeting';
      taskType = 'Meeting';
      suggestedTitle = text.length > 40 ? `${text.substring(0, 37)}...` : text;
      suggestedDescription = `Structured discussion/outreach regarding: ${text}`;
      estimatedDuration = 15;
      subtasks = ['Prepare speaking points or email draft 📝', 'Conduct meeting or send detailed message', 'Follow up on action items'];
      explanation = `Clear and honest communication is essential to successful collaboration. 🍃`;
    }
    // 4. Goals / Ambitious projects
    else if (textLower.includes('goal') || textLower.includes('project') || textLower.includes('finish') || textLower.includes('complete') || textLower.includes('achieve') || textLower.includes('write') || textLower.includes('build')) {
      suggestionType = 'Goal';
      taskType = 'Assignment';
      priority = 'High';
      suggestedTitle = text.length > 40 ? `${text.substring(0, 37)}...` : text;
      suggestedDescription = `Major objective: ${text}`;
      estimatedDuration = 90;
      subtasks = ['Outline the key stages and milestones 🎯', 'Set up a deep focus session block', 'Implement and verify primary results'];
      explanation = `A solid foundation of planning is key to successful project completion. Let's build towards your goals.`;
    }
    // 5. Reminders
    else if (textLower.includes('remember') || textLower.includes('don\'t forget') || textLower.includes('forget') || textLower.includes('remind') || textLower.includes('check')) {
      suggestionType = 'Reminder';
      taskType = 'Other';
      priority = 'Low';
      suggestedTitle = text.replace(/remember to\s*/i, '').replace(/remind me to\s*/i, '');
      suggestedTitle = suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1);
      suggestedTitle = suggestedTitle.length > 40 ? `${suggestedTitle.substring(0, 37)}...` : suggestedTitle;
      suggestedDescription = `Reminder: ${text}`;
      estimatedDuration = 10;
      subtasks = ['Acknowledge reminder and check context ✔', 'Perform the quick scheduled check/action'];
      explanation = `Keeping accurate reminders ensures you never miss important details. ✉️`;
    }

    return {
      id: `suggestion-${index}-${Date.now()}`,
      ideaId: idea.id,
      originalText: text,
      suggestionType,
      suggestedTitle,
      suggestedDescription,
      taskType,
      priority,
      estimatedDuration,
      subtasks,
      explanation
    };
  });
}

// POST /api/astra/organize-ideas
app.post('/api/astra/organize-ideas', async (req, res) => {
  try {
    const { ideas, userName } = req.body;
    const ai = getGeminiClient();

    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return res.json({ suggestions: [] });
    }

    if (!ai) {
      const suggestions = getProgrammaticIdeaSuggestions(ideas);
      return res.json({ suggestions, isAi: false });
    }

    const prompt = `You are Astra, the peaceful and highly helpful AI productivity companion.
The user's name is ${userName || 'Friend'}. We have a list of raw thoughts/ideas captured in the user's "Idea Inbox":
${JSON.stringify(ideas.map((id: any) => ({ id: id.id, text: id.text })))}

Analyze each idea and suggest converting it into one of the following category types:
- 'Task' (general tasks, map taskType to 'Personal' or 'Other')
- 'Shopping Item' (shopping list items, map taskType to 'Shopping')
- 'Study Session' (learning/academic, map taskType to 'Study')
- 'Goal' (ambitious objectives, map taskType to 'Assignment' or 'Personal')
- 'Meeting' (discussions/appointments, map taskType to 'Meeting')
- 'Reminder' (simple notices, map taskType to 'Other')

For each suggestion, provide:
1. "ideaId": the exact string ID of the original idea.
2. "suggestionType": one of: 'Task', 'Shopping Item', 'Study Session', 'Goal', 'Meeting', 'Reminder'.
3. "suggestedTitle": a polished, clear, action-oriented title (max 50 chars).
4. "suggestedDescription": an encouraging description that preserves any important context (max 150 chars).
5. "taskType": the best matching technical TaskType from this list: 'Study', 'Assignment', 'Bills', 'Workout', 'Reading', 'Meeting', 'Shopping', 'Personal', 'Other'.
6. "priority": the appropriate priority ('Low', 'Medium', 'High').
7. "estimatedDuration": realistic duration in minutes (e.g. 15, 30, 60, 90).
8. "subtasks": an array of 2-3 logical subtask titles to help them break down this item.
9. "explanation": a short (1 sentence), warm, forest-themed or serene explanation of why this conversion is recommended.

Return strictly a JSON response inside a "suggestions" array matching this structure:
{
  "suggestions": [
    {
      "ideaId": "idea_id_here",
      "suggestionType": "Task",
      "suggestedTitle": "Title...",
      "suggestedDescription": "Description...",
      "taskType": "Personal",
      "priority": "Medium",
      "estimatedDuration": 30,
      "subtasks": ["Step 1", "Step 2"],
      "explanation": "Let's turn this seed of thought into a sturdy trunk of action. 🌿"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"suggestions":[]}');
    const suggestions = (parsed.suggestions || []).map((s: any, idx: number) => {
      // Find original text
      const orig = ideas.find((id: any) => id.id === s.ideaId);
      return {
        id: `suggestion-${idx}-${Date.now()}`,
        ideaId: s.ideaId,
        originalText: orig ? orig.text : '',
        suggestionType: s.suggestionType || 'Task',
        suggestedTitle: s.suggestedTitle || (orig ? orig.text : 'New Task'),
        suggestedDescription: s.suggestedDescription || 'Nurtured by Astra',
        taskType: s.taskType || 'Personal',
        priority: s.priority || 'Medium',
        estimatedDuration: s.estimatedDuration || 30,
        subtasks: s.subtasks || ['Begin task with quiet focus'],
        explanation: s.explanation || "Let's nurture this intention steadily. 🌿"
      };
    });

    res.json({ suggestions, isAi: true });
  } catch (error: any) {
    const isTemp = error?.status === 429 || error?.status === 503 || error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('quota') || error?.message?.includes('temporary') || error?.message?.includes('demand') || error?.message?.includes('UNAVAILABLE');
    if (isTemp) {
      console.log('[GetItDone] Idea organization: Service temporarily busy or quota limited, returning programmatic offline suggestions.');
    } else {
      console.log('[GetItDone] Idea organization: Returning programmatic offline suggestions.');
    }
    const { ideas } = req.body;
    const suggestions = getProgrammaticIdeaSuggestions(ideas || []);
    res.json({ suggestions, isAi: false });
  }
});

// Vite Middleware for development vs serving static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GetItDone] Full-stack server active at http://localhost:${PORT}`);
  });
}

startServer();

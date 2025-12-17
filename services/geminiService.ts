
import { GoogleGenAI, Type } from "@google/genai";
import { Task, EnergyLevel, DailyReport } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Gemini API key not found. AI features will be disabled.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getTaskSuggestions(tasks: Task[], energy: EnergyLevel) {
  if (!ai) {
    console.warn('AI service not available');
    return [];
  }

  const model = "gemini-3-flash-preview";
  const prompt = `
    Based on the user's current ${energy} energy level, suggest which of these tasks they should prioritize.
    Tasks: ${JSON.stringify(tasks.filter(t => !t.isCompleted))}

    Provide 3 suggestions. Explain why each task fits the current energy level.
    Be encouraging and supportive. Return a list of objects with "taskId", "reason", and "vibeCheck".
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              reason: { type: Type.STRING },
              vibeCheck: { type: Type.STRING }
            },
            required: ["taskId", "reason", "vibeCheck"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
    return [];
  }
}

export async function generateDailyReport(completedTasks: Task[], notes: string, energy: EnergyLevel): Promise<string> {
  if (!ai) {
    return "Great work today! You completed several tasks and stayed productive. Keep up the momentum tomorrow!";
  }

  const model = "gemini-3-flash-preview";
  const prompt = `
    Generate a friendly, encouraging end-of-day report.
    User's energy today was ${energy}.
    They completed these tasks: ${completedTasks.map(t => t.title).join(", ")}.
    Daily notes: ${notes}.

    Acknowledge their effort, highlight patterns, and offer one small piece of advice for tomorrow.
    Keep it under 150 words. Be their "supportive productivity sidekick". Use emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });
    return response.text || "You did great today! Every task completed is a step forward. Rest up and let's crush it tomorrow.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error generating AI report. But hey, you still crushed it!";
  }
}

export async function getWeeklyInsights(reports: DailyReport[]) {
  if (!ai) {
    return ["You're showing great consistency!", "Try tracking your energy more often to see patterns.", "Your focus has been well-distributed across projects."];
  }

  const model = "gemini-3-pro-preview";
  const prompt = `Analyze these daily reports and provide 3 high-level productivity insights. Look for trends between energy levels and completed tasks.
  Reports: ${JSON.stringify(reports)}
  Return insights as a list of strings.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return ["You're showing great consistency!", "Try tracking your energy more often to see patterns.", "Your 'Work' project is getting the most focus lately."];
  }
}

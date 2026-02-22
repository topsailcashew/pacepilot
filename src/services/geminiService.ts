import { GoogleGenAI, Type } from '@google/genai';
import { Task, EnergyLevel, DailyReport } from '@/types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

/**
 * Lazily initialises the Gemini client only when an API key is available.
 * Throws a descriptive error if the key is missing rather than silently failing.
 */
function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      'VITE_GEMINI_API_KEY is not set. Add it to your .env file and restart the dev server.'
    );
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

/** Model identifiers – update here if the Gemini product line changes */
const MODELS = {
  flash: 'gemini-2.0-flash',
  pro: 'gemini-1.5-pro',
} as const;

/**
 * Generates a friendly end-of-day summary for the user.
 *
 * @param completedTasks - Tasks the user finished today
 * @param notes - Any free-form notes the user added
 * @param energy - Their energy level for the day
 * @returns A short motivational string (≤150 words)
 */
export async function generateDailyReport(
  completedTasks: Task[],
  notes: string,
  energy: EnergyLevel
): Promise<string> {
  const prompt = `
    Generate a friendly, encouraging end-of-day report.
    User's energy today was ${energy}.
    They completed these tasks: ${completedTasks.map((t) => t.title).join(', ') || 'none'}.
    Daily notes: ${notes || 'none'}.

    Acknowledge their effort, highlight patterns, and offer one small piece of advice for tomorrow.
    Keep it under 150 words. Be their "supportive productivity sidekick". Use emojis.
  `;

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODELS.flash,
      contents: prompt,
    });

    return (
      response.text ??
      'You did great today! Every task completed is a step forward. Rest up and let\'s crush it tomorrow. 🚀'
    );
  } catch (error) {
    console.error('[geminiService] generateDailyReport failed:', error);
    return "Couldn't reach the AI right now, but you still crushed it today! 💪";
  }
}

/**
 * Analyses a week of daily reports and extracts high-level productivity insights.
 *
 * @param reports - Daily reports to analyse (typically 7 days)
 * @returns An array of 3–4 insight strings, or fallback tips on error
 */
export async function getWeeklyInsights(reports: DailyReport[]): Promise<string[]> {
  if (reports.length === 0) {
    return ['Start logging daily reports to unlock weekly insights!'];
  }

  const prompt = `
    Analyse these daily productivity reports and provide 3–4 high-level insights.
    Look for trends between energy levels and completed tasks, and identify patterns.
    Reports: ${JSON.stringify(reports)}
    Return insights as a JSON array of strings.
  `;

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODELS.pro,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    return JSON.parse(response.text ?? '[]') as string[];
  } catch (error) {
    console.error('[geminiService] getWeeklyInsights failed:', error);
    return [
      "You're showing great consistency!",
      'Try tracking your energy more often to uncover performance patterns.',
      "Your busiest project is getting the most focus lately — keep it up!",
    ];
  }
}

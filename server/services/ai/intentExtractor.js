'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client using the key you set up earlier
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract structured learning intent from a user message.
 *
 * @param {string} userMessage         - The raw user input describing their goal.
 * @param {Array<{role,content}>} conversationHistory - Previous messages (last 4 used).
 * @returns {Promise<Object>} Parsed intent JSON object.
 */
const extractIntent = async (userMessage, conversationHistory = []) => {
  const systemPrompt = `You are an expert educational intent parser. Your sole job is to extract structured learning intent from a user message.

ALWAYS respond with a single valid JSON object with exactly these fields:
{
  "primaryGoal": "one clear sentence describing the main learning objective",
  "domain": "the main technical domain (e.g., 'Machine Learning', 'Web Development', 'Data Science', 'Cloud Computing')",
  "subTopics": ["specific sub-topics or technologies mentioned or implied"],
  "currentLevel": "beginner|intermediate|advanced — infer from context if not explicit",
  "timeframeWeeks": number — how many weeks the user wants (default 8 if not mentioned),
  "learningPurpose": "career-change|job-skill|academic|personal-project|interview-prep|upskilling",
  "existingSkills": ["skills the user says they already have"],
  "constraints": ["time constraints, budget limits, preferred formats, or other restrictions"],
  "urgency": "low|medium|high — infer from language cues like 'asap', 'soon', 'eventually'"
}

Be concise. Fill every field. Use empty arrays [] if nothing is mentioned.`;

  // Gemini uses "model" instead of "assistant" for AI responses, and expects a "parts" array
  const recentHistory = (conversationHistory || []).slice(-4).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: typeof msg.content === 'string' ? msg.content : String(msg.content) }],
  }));

  const contents = [
    ...recentHistory,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  // Configure the Gemini model
  // Configure the Gemini model
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Updated to gemini-pro
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 400,
      responseMimeType: 'application/json',
    },
  });

  let raw = '';
  try {
    const result = await model.generateContent({ contents });
    raw = result.response.text();
  } catch (err) {
    console.error("Gemini API Error:", err);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: construct minimal intent from user message if parsing fails
    parsed = {
      primaryGoal: userMessage,
      domain: 'General Technology',
      subTopics: [],
      currentLevel: 'beginner',
      timeframeWeeks: 8,
      learningPurpose: 'upskilling',
      existingSkills: [],
      constraints: [],
      urgency: 'medium',
    };
  }

  // Ensure required fields have defaults
  return {
    primaryGoal: parsed.primaryGoal || userMessage,
    domain: parsed.domain || 'General Technology',
    subTopics: Array.isArray(parsed.subTopics) ? parsed.subTopics : [],
    currentLevel: parsed.currentLevel || 'beginner',
    timeframeWeeks: typeof parsed.timeframeWeeks === 'number' ? parsed.timeframeWeeks : 8,
    learningPurpose: parsed.learningPurpose || 'upskilling',
    existingSkills: Array.isArray(parsed.existingSkills) ? parsed.existingSkills : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
    urgency: parsed.urgency || 'medium',
  };
};

module.exports = { extractIntent };
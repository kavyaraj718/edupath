'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Stream a chat response to the client via Server-Sent Events (SSE) using Gemini.
 * Saves the conversation turn to user.chatHistory.
 *
 * @param {Object} user        - Mongoose User document (already fetched).
 * @param {string} userMessage - The user's message.
 * @param {Object|null} activePath - The user's current LearningPath, if any.
 * @param {Object} res         - Express response object.
 */
const streamChat = async (user, userMessage, activePath, res) => {
  // ── Set SSE headers ────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // ── Build system prompt ────────────────────────────────────────────────────
  const userSkills = (user.skills || [])
    .slice(0, 10)
    .map((s) => `${s.name} (${s.level})`)
    .join(', ') || 'none listed';

  let pathContext = '';
  if (activePath) {
    const completedMs = (activePath.milestones || []).filter((m) => m.isCompleted).length;
    const totalMs = (activePath.milestones || []).length;
    pathContext = `\n\nACTIVE LEARNING PATH:
- Title: ${activePath.title}
- Goal: ${activePath.goal}
- Progress: ${completedMs}/${totalMs} milestones complete (${activePath.completionPct || 0}%)
- Status: ${activePath.status}`;
  }

  const systemPrompt = `You are PathAI, an intelligent and encouraging learning coach for EduPath.

USER CONTEXT:
- Name: ${user.name}
- Target Role: ${user.targetRole || 'not set'}
- Current Role: ${user.currentRole || 'not set'}
- Experience: ${user.experience || 'student'}
- Skills: ${userSkills}${pathContext}

YOUR PERSONA:
- Warm, motivating, and technically precise
- Provide actionable advice, not vague encouragement
- When asked about learning topics, give structured, step-by-step guidance
- Reference the user's active path and progress when relevant
- Suggest specific resources when helpful
- Keep responses concise but complete (200-400 words unless detail is needed)
- Use markdown formatting for code, lists, and headings when appropriate`;

  // ── Build conversation history (last 10 messages) ─────────────────────────
  // Note: Gemini expects roles to be 'user' or 'model' (instead of 'assistant')
  const historyContents = (user.chatHistory || [])
    .slice(-10)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const contents = [
    ...historyContents,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  // Configure the Gemini model
  // Configure the Gemini model
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Updated to gemini-pro
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  // ── Stream Gemini response ─────────────────────────────────────────────────
  let fullResponse = '';

  try {
    const resultStream = await model.generateContentStream({ contents });

    for await (const chunk of resultStream.stream) {
      const delta = chunk.text();
      if (delta) {
        fullResponse += delta;
        // Send SSE event
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Signal stream end
    res.write('data: [DONE]\n\n');
    res.end();

    // ── Persist conversation to DB (async, non-blocking) ─────────────────────
    setImmediate(async () => {
      try {
        await User.findByIdAndUpdate(user._id, {
          $push: {
            chatHistory: {
              $each: [
                { role: 'user', content: userMessage, timestamp: new Date() },
                { role: 'assistant', content: fullResponse, timestamp: new Date() },
              ],
            },
          },
        });

        // Cap chat history to last 100 messages to avoid unbounded growth
        const updatedUser = await User.findById(user._id).select('chatHistory');
        if (updatedUser && updatedUser.chatHistory.length > 100) {
          const trimmed = updatedUser.chatHistory.slice(-100);
          await User.findByIdAndUpdate(user._id, {
            $set: { chatHistory: trimmed },
          });
        }
      } catch (saveErr) {
        console.error('[chatService] Failed to save chat history:', saveErr.message);
      }
    });
  } catch (streamErr) {
    console.error('[chatService] Streaming error:', streamErr.message);

    // Try to send error event if connection is still open
    try {
      res.write(
        `data: ${JSON.stringify({ error: 'An error occurred during streaming. Please try again.' })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } catch {
      // Connection already closed
    }
  }
};

module.exports = { streamChat };
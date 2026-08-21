'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Builds a clean, strictly alternating list of Gemini contents from chatHistory.
 * Gemini requires:
 * 1. Roles to be 'user' or 'model'.
 * 2. Strictly alternating turns ('user' -> 'model' -> 'user' -> ...).
 * 3. The first message must have role 'user'.
 * 4. Parts must contain non-empty text strings.
 */
function buildGeminiContents(chatHistory, userMessage) {
  const safeHistory = (chatHistory || [])
    .slice(-14)
    .filter((msg) => msg && typeof msg.content === 'string' && msg.content.trim().length > 0)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      text: msg.content.trim(),
    }));

  const cleaned = [];
  for (const item of safeHistory) {
    if (cleaned.length === 0) {
      if (item.role === 'user') {
        cleaned.push(item);
      }
    } else {
      const prev = cleaned[cleaned.length - 1];
      if (prev.role === item.role) {
        prev.text += `\n\n${item.text}`;
      } else {
        cleaned.push(item);
      }
    }
  }

  // Ensure current user message is included
  const currentMsg = (userMessage || '').trim();
  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
    cleaned[cleaned.length - 1].text += `\n\n${currentMsg}`;
  } else {
    cleaned.push({ role: 'user', text: currentMsg });
  }

  return cleaned.map((c) => ({
    role: c.role,
    parts: [{ text: c.text }],
  }));
}

/**
 * Send a complete chat response via Server-Sent Events (SSE) using Gemini.
 * Saves the conversation turn to user.chatHistory.
 *
 * @param {Object} user        - Mongoose User document (already fetched).
 * @param {string} userMessage - The user's message.
 * @param {Object|null} activePath - The user's current LearningPath, if any.
 * @param {string|null} sessionId - The conversation session to continue.
 * @param {Object} res         - Express response object.
 */
const streamChat = async (user, userMessage, activePath, sessionId, res) => {
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

YOUR PERSONA & OUTPUT RULES:
- Warm, motivating, and technically precise.
- Provide actionable advice, not vague encouragement.
- When asked about learning topics, give structured, step-by-step guidance.
- Reference the user's active path and progress when relevant.
- Suggest specific resources when helpful.
- Provide full, thorough explanations and complete answers. Never cut off or end abruptly in the middle of a sentence, list item, or code block.
- Use clear Markdown formatting with headings, bold text, bullet points, and syntax-highlighted code blocks where appropriate.`;

  const selectedSession = (user.chatSessions || []).find(
    (session) => session._id === sessionId
  );
  const legacyHistory = user.chatHistory || [];
  const chatHistory = selectedSession
    ? selectedSession.messages
    : sessionId === 'legacy' || !(user.chatSessions || []).length
      ? legacyHistory
      : [];
  const contents = buildGeminiContents(chatHistory, userMessage);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  let fullResponse = '';

  try {
    const resultStream = await model.generateContentStream({ contents });

    for await (const chunk of resultStream.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        res.write(`data: ${JSON.stringify({ delta: chunkText })}\n\n`);
      }
    }

    // Check if the generation was truncated due to max tokens, and continue if needed
    try {
      const responseData = await resultStream.response;
      const finishReason = responseData.candidates?.[0]?.finishReason;

      if (finishReason === 'MAX_TOKENS') {
        const continuationContents = [
          ...contents,
          { role: 'model', parts: [{ text: fullResponse }] },
          {
            role: 'user',
            parts: [{ text: 'Continue exactly where you stopped. Do not repeat prior text; finish the remaining answer completely.' }],
          },
        ];

        const continuationStream = await model.generateContentStream({ contents: continuationContents });
        for await (const chunk of continuationStream.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullResponse += chunkText;
            res.write(`data: ${JSON.stringify({ delta: chunkText })}\n\n`);
          }
        }
      }
    } catch (finishErr) {
      console.warn('[chatService] Non-critical finish check warning:', finishErr.message);
    }

    if (!fullResponse) {
      throw new Error('Gemini returned an empty response.');
    }

    // Signal stream end
    res.write('data: [DONE]\n\n');
    res.end();

    // ── Persist conversation to DB (async, non-blocking) ─────────────────────
    setImmediate(async () => {
      try {
        const updatedUser = await User.findById(user._id);
        if (!updatedUser) return;

        const effectiveSessionId = sessionId || 'legacy';
        let session = updatedUser.chatSessions.find(
          (item) => item._id === effectiveSessionId
        );
        if (!session) {
          session = {
            _id: effectiveSessionId,
            title: userMessage.trim().slice(0, 80) || 'New chat',
            messages: effectiveSessionId === 'legacy' ? [...updatedUser.chatHistory] : [],
          };
          updatedUser.chatSessions.push(session);
        }

        session.messages.push(
          { role: 'user', content: userMessage, timestamp: new Date() },
          { role: 'assistant', content: fullResponse, timestamp: new Date() }
        );
        session.messages = session.messages.slice(-100);
        await updatedUser.save();
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

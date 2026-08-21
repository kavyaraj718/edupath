'use strict';

const LearningPath = require('../models/LearningPath');
const User = require('../models/User');
const { extractIntent } = require('../services/ai/intentExtractor');
const { retrieveRelevantCourses } = require('../services/ai/ragRetriever');
const { generateRoadmap } = require('../services/ai/roadmapGenerator');
const { streamChat } = require('../services/ai/chatService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to safely parse AI JSON responses and strip Markdown
const parseAIResponse = (rawText) => {
  try {
    // Remove markdown code blocks if the AI added them
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to parse AI JSON. Raw output was:", rawText);
    throw new Error("The AI returned malformed data that could not be processed.");
  }
};

// ─── POST /api/ai/generate-path ───────────────────────────────────────────────
const generatePath = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message describing your learning goal is required.',
      });
    }

    const user = await User.findById(req.user._id).populate(
      'completedCourseIds',
      '_id title'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Step 1: Extract structured intent from user message
    const intent = await extractIntent(message, conversationHistory);

    // Step 2: RAG — retrieve relevant courses via vector search
    const retrievedCourses = await retrieveRelevantCourses(intent, user);

    // Step 3: Generate structured roadmap via LLM
    const roadmapData = await generateRoadmap(user, intent, retrievedCourses);

    // Step 4: Persist LearningPath to DB
    const targetDate = roadmapData.totalWeeks
      ? new Date(Date.now() + roadmapData.totalWeeks * 7 * 24 * 60 * 60 * 1000)
      : null;

    const learningPath = new LearningPath({
      userId: user._id,
      title: roadmapData.title || `Path: ${intent.primaryGoal}`,
      goal: intent.primaryGoal || message,
      summary: roadmapData.summary || '',
      aiExplanation: roadmapData.aiExplanation || '',
      totalWeeks: roadmapData.totalWeeks || 4,
      startDate: new Date(),
      targetDate,
      milestones: roadmapData.milestones || [],
      prerequisites: roadmapData.prerequisites || [],
      status: 'active',
      generatedByModel: 'gemini-2.5-flash',
      promptVersion: 'v1',
    });

    await learningPath.save();

    return res.status(201).json({
      success: true,
      message: 'Learning path generated successfully.',
      path: learningPath,
      intent,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
const chat = async (req, res, next) => {
  try {
    const { message, activePathId, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A message is required.',
      });
    }

    let activePath = null;
    if (activePathId) {
      activePath = await LearningPath.findOne({
        _id: activePathId,
        userId: req.user._id,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delegate to streaming chat service (sets SSE headers internally)
    await streamChat(user, message, activePath, sessionId, res);
  } catch (err) {
    // If SSE headers already sent, we can't send a normal JSON error
    if (!res.headersSent) {
      next(err);
    } else {
      console.error('Chat stream error after headers sent:', err.message);
      res.end();
    }
  }
};

// ─── POST /api/ai/explain-concept ─────────────────────────────────────────────
const explainConcept = async (req, res, next) => {
  try {
    const { concept, context } = req.body;

    if (!concept) {
      return res.status(400).json({
        success: false,
        message: 'concept is required.',
      });
    }

    const user = req.user;
    const userLevel = user.experience || 'student';
    const domain = context || user.targetRole || 'general technology';

    const systemPrompt = `You are an expert educator. Explain technical concepts clearly and concisely.
Always respond with valid JSON matching exactly this schema:
{
  "definition": "clear, jargon-free definition",
  "analogy": "a real-world analogy that makes it intuitive",
  "example": "a short concrete code or real-world example",
  "whyItMatters": "why this concept is important for the learner's goals",
  "nextConcepts": ["concept1", "concept2", "concept3"]
}`;

    const userPrompt = `Explain the concept: "${concept}"
User experience level: ${userLevel}
Relevant domain/context: ${domain}
Tailor the explanation appropriately for this level.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(userPrompt);
    
    // Using the new helper function
    const explanation = parseAIResponse(result.response.text());

    return res.status(200).json({
      success: true,
      concept,
      explanation,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/skill-gap ────────────────────────────────────────────────────
const getSkillGap = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Please set a target role in your profile before running skill gap analysis.',
      });
    }

    const userSkills = user.skills.map(
      (s) => `${s.name} (${s.level})`
    );

    const systemPrompt = `You are a senior technical career coach. Analyze skill gaps objectively.
Always respond with valid JSON matching exactly this schema:
{
  "requiredSkills": [
    {
      "name": "skill name",
      "importance": "critical|important|nice-to-have",
      "userHas": true or false,
      "userLevel": "beginner|intermediate|advanced|none",
      "gapDescription": "brief description of the gap if any"
    }
  ],
  "gapSummary": "2-3 sentence summary of overall gap",
  "estimatedWeeksToReady": number,
  "topPriorities": ["skill1", "skill2", "skill3"]
}`;

    const userPrompt = `Target role: ${user.targetRole}
Current role: ${user.currentRole || 'Not specified'}
Experience level: ${user.experience || 'student'}
Current skills: ${userSkills.length > 0 ? userSkills.join(', ') : 'None listed'}

Identify the skill gap for this user to be job-ready for the target role.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(userPrompt);
    
    // Using the new helper function
    const analysis = parseAIResponse(result.response.text());

    return res.status(200).json({
      success: true,
      targetRole: user.targetRole,
      currentRole: user.currentRole,
      analysis,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/adapt-milestone ─────────────────────────────────────────────
const adaptMilestone = async (req, res, next) => {
  try {
    const { pathId, milestoneId, reason, difficultyAdjustment } = req.body;

    if (!pathId || !milestoneId) {
      return res.status(400).json({
        success: false,
        message: 'pathId and milestoneId are required.',
      });
    }

    const path = await LearningPath.findOne({
      _id: pathId,
      userId: req.user._id,
    });

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found.',
      });
    }

    const milestoneIndex = path.milestones.findIndex(
      (m) => m._id.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found in this path.',
      });
    }

    const milestone = path.milestones[milestoneIndex];
    const user = req.user;

    // Re-run RAG with adjusted intent
    const adjustedIntent = {
      primaryGoal: path.goal,
      domain: milestone.title,
      subTopics: milestone.skills,
      currentLevel: difficultyAdjustment === 'easier' ? 'beginner' : 'intermediate',
      timeframeWeeks: 1,
      constraints: reason ? [reason] : [],
    };

    const newCourses = await retrieveRelevantCourses(adjustedIntent, user, 6);

    // Generate adapted milestone content
    const systemPrompt = `You are an adaptive curriculum designer. Re-design a single milestone with better-suited resources.
Respond with valid JSON:
{
  "title": "milestone title",
  "description": "updated description",
  "skills": ["skill1", "skill2"],
  "resources": [
    {
      "courseId": "objectid or null",
      "title": "resource title",
      "url": "url",
      "type": "course|article|project|quiz|video",
      "estimatedHours": number,
      "whyRecommended": "reason"
    }
  ]
}`;

    const userPrompt = `Original milestone: "${milestone.title}"
Original description: "${milestone.description}"
Adaptation reason: "${reason || 'User requested adjustment'}"
Difficulty adjustment: ${difficultyAdjustment || 'maintain'}
User experience: ${user.experience}
Available courses (use these): ${JSON.stringify(
      newCourses.map((c) => ({
        id: c._id,
        title: c.title,
        url: c.url,
        difficulty: c.difficulty,
        durationHours: c.durationHours,
        topics: c.topics,
      })),
      null,
      2
    )}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(userPrompt);
    
    // Using the new helper function
    const adapted = parseAIResponse(result.response.text());

    // Update milestone in path
    path.milestones[milestoneIndex].title = adapted.title || milestone.title;
    path.milestones[milestoneIndex].description = adapted.description || milestone.description;
    path.milestones[milestoneIndex].skills = adapted.skills || milestone.skills;
    path.milestones[milestoneIndex].resources = adapted.resources || milestone.resources;

    path.adaptations.push({
      reason: reason || 'User-requested milestone adaptation',
      appliedAt: new Date(),
    });

    path.markModified('milestones');
    await path.save();

    return res.status(200).json({
      success: true,
      message: 'Milestone adapted successfully.',
      milestone: path.milestones[milestoneIndex],
      adaptation: path.adaptations[path.adaptations.length - 1],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generatePath,
  chat,
  explainConcept,
  getSkillGap,
  adaptMilestone,
};
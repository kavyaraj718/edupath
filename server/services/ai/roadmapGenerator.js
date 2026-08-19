'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a structured learning roadmap using Gemini.
 *
 * @param {Object} userProfile      - Mongoose User document.
 * @param {Object} intent           - Parsed intent from intentExtractor.
 * @param {Array}  retrievedCourses - Courses from ragRetriever.
 * @returns {Promise<Object>}       - Parsed roadmap JSON.
 */
const generateRoadmap = async (userProfile, intent, retrievedCourses) => {
  const systemPrompt = `You are an expert curriculum designer and learning coach with 15+ years of experience building personalized learning paths.

Your task: Create a structured, realistic, and actionable learning roadmap.

STRICT RULES:
1. You MUST only use courses from the "Available Courses" list provided. Do NOT invent courses.
2. Each resource must reference a real courseId from the available list.
3. Distribute content evenly across weeks — do not front-load.
4. Match difficulty to the user's current level and progress toward target role.
5. Respect the user's daily available minutes and learning style.
6. Every milestone must have clear, measurable skills.

ALWAYS respond with a single valid JSON object with exactly this schema:
{
  "title": "Catchy, specific path title (e.g., 'Full-Stack Web Dev: React + Node.js in 8 Weeks')",
  "summary": "2-3 sentence overview of what the learner will achieve",
  "aiExplanation": "2-3 sentences explaining WHY this path was designed this way for this specific user",
  "totalWeeks": number,
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "milestones": [
    {
      "week": 1,
      "title": "Week title (e.g., 'Python Fundamentals')",
      "description": "What the learner will accomplish this week",
      "skills": ["skill1", "skill2", "skill3"],
      "resources": [
        {
          "courseId": "exact _id string from available courses",
          "title": "Course title",
          "url": "Course URL",
          "type": "course|article|project|quiz|video",
          "estimatedHours": number,
          "whyRecommended": "Specific reason this resource fits here"
        }
      ]
    }
  ]
}

Include 1-3 resources per milestone. Keep milestones to the user's weekly capacity.`;

  // Prepare user context
  const userSkills = (userProfile.skills || [])
    .map((s) => `${s.name} (${s.level})`)
    .join(', ') || 'None specified';

  const completedCount = (userProfile.completedCourseIds || []).length;
  const dailyMins = userProfile.learningPreferences?.dailyMinutes || 30;
  const weeklyHours = Math.round((dailyMins * 5) / 60); // assume 5 days/week
  const style = userProfile.learningPreferences?.style || 'video';

  const userContext = `
LEARNER PROFILE:
- Name: ${userProfile.name}
- Current Role: ${userProfile.currentRole || 'Not specified'}
- Target Role: ${userProfile.targetRole || 'Not specified'}
- Experience Level: ${userProfile.experience || 'student'}
- Existing Skills: ${userSkills}
- Completed Courses: ${completedCount} courses previously
- Available Time: ~${dailyMins} min/day (~${weeklyHours} hrs/week)
- Preferred Learning Style: ${style}
- Interests: ${(userProfile.interests || []).join(', ') || 'Not specified'}

LEARNING INTENT:
- Primary Goal: ${intent.primaryGoal}
- Domain: ${intent.domain}
- Sub-Topics: ${(intent.subTopics || []).join(', ') || 'None'}
- Target Duration: ${intent.timeframeWeeks || 8} weeks
- Purpose: ${intent.learningPurpose || 'Not specified'}
- Constraints: ${(intent.constraints || []).join(', ') || 'None'}
- Urgency: ${intent.urgency || 'medium'}`;

  // Serialize courses for the prompt (exclude embedding, limit description length)
  const coursesForPrompt = (retrievedCourses || []).map((c) => ({
    _id: c._id?.toString() || c.id?.toString(),
    title: c.title,
    provider: c.provider,
    url: c.url,
    description: (c.description || '').substring(0, 200),
    topics: c.topics,
    domain: c.domain,
    difficulty: c.difficulty,
    prerequisites: c.prerequisites,
    durationHours: c.durationHours,
    rating: c.rating,
    isFree: c.isFree,
  }));

  const userMessage = `${userContext}

AVAILABLE COURSES (use ONLY these, reference by _id):
${JSON.stringify(coursesForPrompt, null, 2)}

Generate a complete learning path for this learner. Make it specific, achievable, and perfectly tailored to their profile.`;

  // Configure the Gemini model
  // Configure the Gemini model
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Updated to gemini-pro
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json', 
    },
  });

  let raw = '';
  try {
    const result = await model.generateContent(userMessage);
    raw = result.response.text();
  } catch (err) {
    console.error('[roadmapGenerator] Gemini API Error:', err);
    throw new Error('AI failed to generate roadmap. Please try again.');
  }

  let roadmap;
  try {
    roadmap = JSON.parse(raw);
  } catch {
    console.error('[roadmapGenerator] Failed to parse JSON response:', raw.substring(0, 200));
    throw new Error('AI returned invalid JSON for roadmap generation. Please try again.');
  }

  // Sanitize milestones: ensure courseId is string
  if (Array.isArray(roadmap.milestones)) {
    roadmap.milestones = roadmap.milestones.map((ms, idx) => ({
      ...ms,
      week: ms.week || idx + 1,
      resources: (ms.resources || []).map((r) => ({
        ...r,
        courseId: r.courseId || null,
        estimatedHours: typeof r.estimatedHours === 'number' ? r.estimatedHours : 1,
      })),
    }));
  }

  return {
    title: roadmap.title || `${intent.domain} Learning Path`,
    summary: roadmap.summary || '',
    aiExplanation: roadmap.aiExplanation || '',
    totalWeeks: typeof roadmap.totalWeeks === 'number' ? roadmap.totalWeeks : (intent.timeframeWeeks || 8),
    prerequisites: Array.isArray(roadmap.prerequisites) ? roadmap.prerequisites : [],
    milestones: Array.isArray(roadmap.milestones) ? roadmap.milestones : [],
  };
};

module.exports = { generateRoadmap };
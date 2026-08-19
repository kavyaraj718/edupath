'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Course = require('../../models/Course');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Retrieve relevant courses via RAG (embedding + MongoDB Atlas $vectorSearch).
 *
 * @param {Object} intent        - Structured intent from intentExtractor.
 * @param {Object} userProfile   - Mongoose User document.
 * @param {number} topK          - Max number of courses to return (default 12).
 * @returns {Promise<Array>}     - Array of matching Course documents.
 */
const retrieveRelevantCourses = async (intent, userProfile, topK = 12) => {
  // Step 1: Build a rich query string from intent fields
  const queryParts = [
    intent.primaryGoal || '',
    intent.domain || '',
    ...(intent.subTopics || []),
    ...(intent.existingSkills || []),
    intent.currentLevel ? `level:${intent.currentLevel}` : '',
    intent.learningPurpose || '',
  ].filter(Boolean);

  const queryText = queryParts.join(' ').trim();

  if (!queryText) {
    console.warn('[ragRetriever] Empty query text — returning empty array.');
    return [];
  }

  // Step 2: Generate embedding for the query text via Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const embeddingResponse = await model.embedContent(queryText);
  const queryEmbedding = embeddingResponse.embedding.values;

  // Step 3: Build exclude list from completed courses
  const excludeIds = (userProfile?.completedCourseIds || []).map((id) =>
    id.toString()
  );

  // Step 4: Run Atlas $vectorSearch via Course static method
  let courses = [];
  try {
    courses = await Course.findSimilar(queryEmbedding, topK, excludeIds);
  } catch (vectorErr) {
    // Gracefully fall back to text search if vector index isn't set up
    console.warn(
      '[ragRetriever] $vectorSearch failed, falling back to text search:',
      vectorErr.message
    );

    const textFilter = {};
    if (intent.domain) {
      textFilter.$text = { $search: intent.domain };
    } else if (intent.primaryGoal) {
      textFilter.$text = { $search: intent.primaryGoal };
    }

    if (Object.keys(textFilter).length > 0) {
      courses = await Course.find(textFilter)
        .select('-embedding -__v')
        .limit(topK)
        .lean();
    } else {
      courses = await Course.find({})
        .select('-embedding -__v')
        .limit(topK)
        .lean();
    }
  }

  return courses;
};

module.exports = { retrieveRelevantCourses };
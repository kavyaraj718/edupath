'use strict';

/**
 * Seed script: Inserts 28 diverse courses into MongoDB with Google Gemini embeddings.
 * Run with: node scripts/seedCourses.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Course = require('../models/Course');

// ─── Gemini Configuration ─────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Course Data ──────────────────────────────────────────────────────────────
const COURSES = [
  // ── Python ──────────────────────────────────────────────────────────────────
  {
    title: 'Python for Everybody Specialization',
    provider: 'Coursera (University of Michigan)',
    url: 'https://www.coursera.org/specializations/python',
    description: 'Learn to program and analyze data with Python. Develop programs to gather, clean, analyze, and visualize data. Ideal absolute beginners.',
    thumbnailUrl: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/python.jpg',
    topics: ['Python', 'Programming Basics', 'Data Structures', 'Web Scraping', 'Databases', 'SQL'],
    domain: 'Python Programming',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 32,
    rating: 4.8,
    enrollmentCount: 1200000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Automate the Boring Stuff with Python',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/automate/',
    description: 'Practical programming for total beginners. Learn Python by automating real tasks: PDFs, spreadsheets, web scraping, scheduling tasks.',
    thumbnailUrl: '',
    topics: ['Python', 'Automation', 'File I/O', 'Web Scraping', 'Regular Expressions', 'Excel Automation'],
    domain: 'Python Programming',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 9.5,
    rating: 4.7,
    enrollmentCount: 450000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Python 3 Masterclass: From Beginner to Expert',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/python-3-masterclass/',
    description: 'Complete Python 3 course covering OOP, decorators, generators, async programming, testing, and design patterns.',
    thumbnailUrl: '',
    topics: ['Python', 'OOP', 'Decorators', 'Generators', 'Async', 'Testing', 'Design Patterns'],
    domain: 'Python Programming',
    difficulty: 'intermediate',
    prerequisites: ['Basic Python'],
    durationHours: 42,
    rating: 4.6,
    enrollmentCount: 320000,
    isFree: false,
    language: 'English',
  },

  // ── Machine Learning ─────────────────────────────────────────────────────────
  {
    title: 'Machine Learning Specialization',
    provider: 'Coursera (DeepLearning.AI & Stanford)',
    url: 'https://www.coursera.org/specializations/machine-learning-introduction',
    description: 'Andrew Ng\'s revamped ML specialization. Covers supervised learning, unsupervised learning, recommender systems, and reinforcement learning.',
    thumbnailUrl: '',
    topics: ['Machine Learning', 'Supervised Learning', 'Neural Networks', 'Decision Trees', 'Clustering', 'Recommender Systems'],
    domain: 'Machine Learning',
    difficulty: 'intermediate',
    prerequisites: ['Python', 'Basic Math'],
    durationHours: 95,
    rating: 4.9,
    enrollmentCount: 800000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow',
    provider: 'O\'Reilly / Self-Study',
    url: 'https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/',
    description: 'Comprehensive textbook covering end-to-end ML projects, classification, regression, SVM, decision trees, ensemble methods, and deep learning.',
    thumbnailUrl: '',
    topics: ['Scikit-Learn', 'TensorFlow', 'Keras', 'Random Forests', 'SVMs', 'CNNs', 'RNNs', 'Model Deployment'],
    domain: 'Machine Learning',
    difficulty: 'intermediate',
    prerequisites: ['Python', 'NumPy', 'Pandas'],
    durationHours: 60,
    rating: 4.9,
    enrollmentCount: 200000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Fast.ai Practical Deep Learning for Coders',
    provider: 'fast.ai',
    url: 'https://course.fast.ai/',
    description: 'Top-down, practical approach to deep learning. Build real-world image classifiers, NLP models, and tabular models before understanding the theory.',
    thumbnailUrl: '',
    topics: ['Deep Learning', 'PyTorch', 'fastai', 'Computer Vision', 'NLP', 'Transfer Learning', 'Stable Diffusion'],
    domain: 'Deep Learning',
    difficulty: 'intermediate',
    prerequisites: ['Python', 'Basic ML'],
    durationHours: 40,
    rating: 4.8,
    enrollmentCount: 300000,
    isFree: true,
    language: 'English',
  },

  // ── Web Development ──────────────────────────────────────────────────────────
  {
    title: 'The Complete Web Developer Bootcamp 2024',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/the-web-developer-bootcamp/',
    description: 'Comprehensive bootcamp covering HTML, CSS, JavaScript, Node.js, Express, MongoDB, and React. 700+ coding exercises included.',
    thumbnailUrl: '',
    topics: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'React', 'Bootstrap'],
    domain: 'Web Development',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 65,
    rating: 4.7,
    enrollmentCount: 900000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Full-Stack Open',
    provider: 'University of Helsinki',
    url: 'https://fullstackopen.com/en/',
    description: 'Free, world-class full-stack web development course. Covers React, Redux, Node.js, Express, REST APIs, GraphQL, TypeScript, and CI/CD.',
    thumbnailUrl: '',
    topics: ['React', 'Redux', 'Node.js', 'Express', 'REST APIs', 'GraphQL', 'TypeScript', 'Testing', 'Docker'],
    domain: 'Web Development',
    difficulty: 'intermediate',
    prerequisites: ['HTML', 'CSS', 'Basic JavaScript'],
    durationHours: 200,
    rating: 4.9,
    enrollmentCount: 500000,
    isFree: true,
    language: 'English',
  },
  {
    title: 'The Odin Project: Full Stack JavaScript',
    provider: 'The Odin Project',
    url: 'https://www.theodinproject.com/paths/full-stack-javascript',
    description: 'Project-based full-stack curriculum. Build 20+ real projects. Covers HTML, CSS, JavaScript, React, Node.js, SQL, and professional Git workflow.',
    thumbnailUrl: '',
    topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'APIs'],
    domain: 'Web Development',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 400,
    rating: 4.8,
    enrollmentCount: 250000,
    isFree: true,
    language: 'English',
  },

  // ── React ────────────────────────────────────────────────────────────────────
  {
    title: 'React - The Complete Guide 2024 (incl. React Router & Redux)',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
    description: 'Dive in and learn React from scratch! Learn React Hooks, Redux, React Router, Next.js, best practices and much more!',
    thumbnailUrl: '',
    topics: ['React', 'React Hooks', 'Redux', 'React Router', 'Next.js', 'Context API', 'Suspense'],
    domain: 'React',
    difficulty: 'intermediate',
    prerequisites: ['JavaScript', 'HTML', 'CSS'],
    durationHours: 68,
    rating: 4.6,
    enrollmentCount: 750000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Epic React by Kent C. Dodds',
    provider: 'EpicReact.dev',
    url: 'https://epicreact.dev/',
    description: 'Professional React training covering fundamental patterns, hooks, advanced patterns, performance optimization, testing, and build tools.',
    thumbnailUrl: '',
    topics: ['React Hooks', 'React Patterns', 'Performance', 'Testing', 'Suspense', 'Concurrent Features', 'TypeScript'],
    domain: 'React',
    difficulty: 'advanced',
    prerequisites: ['React Basics', 'JavaScript ES6+'],
    durationHours: 50,
    rating: 4.9,
    enrollmentCount: 80000,
    isFree: false,
    language: 'English',
  },

  // ── Node.js ──────────────────────────────────────────────────────────────────
  {
    title: 'Node.js: The Complete Guide (MVC, REST APIs, GraphQL, Deno)',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/nodejs-the-complete-guide/',
    description: 'Master Node.js: build REST APIs, GraphQL APIs, add authentication, work with SQL & NoSQL databases, deploy with Docker & AWS.',
    thumbnailUrl: '',
    topics: ['Node.js', 'Express', 'REST APIs', 'GraphQL', 'MongoDB', 'Sequelize', 'Authentication', 'Docker', 'AWS'],
    domain: 'Node.js',
    difficulty: 'intermediate',
    prerequisites: ['JavaScript'],
    durationHours: 40,
    rating: 4.6,
    enrollmentCount: 400000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Node.js Design Patterns',
    provider: 'Packt / Self-Study',
    url: 'https://www.nodejsdesignpatterns.com/',
    description: 'Comprehensive guide to Node.js design patterns: creational, structural, behavioral, and concurrency patterns with real-world examples.',
    thumbnailUrl: '',
    topics: ['Node.js', 'Design Patterns', 'Streams', 'Event Loop', 'Worker Threads', 'Microservices', 'Scalability'],
    domain: 'Node.js',
    difficulty: 'advanced',
    prerequisites: ['Node.js Basics', 'JavaScript ES6+'],
    durationHours: 35,
    rating: 4.7,
    enrollmentCount: 50000,
    isFree: false,
    language: 'English',
  },

  // ── Data Science ─────────────────────────────────────────────────────────────
  {
    title: 'IBM Data Science Professional Certificate',
    provider: 'Coursera (IBM)',
    url: 'https://www.coursera.org/professional-certificates/ibm-data-science',
    description: '12-course certificate covering data science tools, Python, SQL, data visualization, ML, and capstone project. Industry-recognized credential.',
    thumbnailUrl: '',
    topics: ['Python', 'SQL', 'Data Visualization', 'Machine Learning', 'Jupyter', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn'],
    domain: 'Data Science',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 120,
    rating: 4.6,
    enrollmentCount: 600000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Data Science: R Basics',
    provider: 'edX (Harvard)',
    url: 'https://www.edx.org/course/data-science-r-basics',
    description: 'Learn R programming basics for data science. Covers R syntax, data wrangling with dplyr, visualization with ggplot2, and probability.',
    thumbnailUrl: '',
    topics: ['R', 'dplyr', 'ggplot2', 'Data Wrangling', 'Statistical Analysis', 'Visualization'],
    domain: 'Data Science',
    difficulty: 'beginner',
    prerequisites: ['Basic Statistics'],
    durationHours: 24,
    rating: 4.5,
    enrollmentCount: 250000,
    isFree: true,
    language: 'English',
  },
  {
    title: 'Applied Data Science with Python Specialization',
    provider: 'Coursera (University of Michigan)',
    url: 'https://www.coursera.org/specializations/data-science-python',
    description: 'Hands-on specialization: data manipulation, charting, applied ML, text mining, and social network analysis using Python toolkits.',
    thumbnailUrl: '',
    topics: ['Pandas', 'Matplotlib', 'Scikit-Learn', 'NLTK', 'NetworkX', 'Data Visualization', 'Applied ML'],
    domain: 'Data Science',
    difficulty: 'intermediate',
    prerequisites: ['Python', 'Basic Statistics'],
    durationHours: 80,
    rating: 4.5,
    enrollmentCount: 350000,
    isFree: false,
    language: 'English',
  },

  // ── SQL / Databases ──────────────────────────────────────────────────────────
  {
    title: 'The Complete SQL Bootcamp: Go from Zero to Hero',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
    description: 'Learn SQL from scratch using PostgreSQL. Covers SELECT, JOINs, aggregations, subqueries, window functions, stored procedures, and more.',
    thumbnailUrl: '',
    topics: ['SQL', 'PostgreSQL', 'JOINs', 'Aggregations', 'Window Functions', 'Stored Procedures', 'Indexing'],
    domain: 'Databases',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 9,
    rating: 4.7,
    enrollmentCount: 500000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'MongoDB - The Complete Developer\'s Guide',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/',
    description: 'Master MongoDB: CRUD operations, aggregation, indexing, transactions, schema design, Mongoose, and Atlas deployment.',
    thumbnailUrl: '',
    topics: ['MongoDB', 'Mongoose', 'Aggregation Pipeline', 'Indexing', 'Transactions', 'Atlas', 'Schema Design'],
    domain: 'Databases',
    difficulty: 'intermediate',
    prerequisites: ['Basic programming'],
    durationHours: 17,
    rating: 4.7,
    enrollmentCount: 150000,
    isFree: false,
    language: 'English',
  },

  // ── Deep Learning / NLP ──────────────────────────────────────────────────────
  {
    title: 'Deep Learning Specialization',
    provider: 'Coursera (DeepLearning.AI)',
    url: 'https://www.coursera.org/specializations/deep-learning',
    description: 'Andrew Ng\'s flagship deep learning curriculum. 5 courses covering neural networks, CNNs, RNNs, LSTM, transformers, and practical tips.',
    thumbnailUrl: '',
    topics: ['Neural Networks', 'CNNs', 'RNNs', 'LSTMs', 'Transformers', 'Batch Normalization', 'Hyperparameter Tuning'],
    domain: 'Deep Learning',
    difficulty: 'intermediate',
    prerequisites: ['Machine Learning Basics', 'Python', 'Linear Algebra'],
    durationHours: 90,
    rating: 4.9,
    enrollmentCount: 700000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Natural Language Processing Specialization',
    provider: 'Coursera (DeepLearning.AI)',
    url: 'https://www.coursera.org/specializations/natural-language-processing',
    description: 'Complete NLP curriculum: sentiment analysis, word embeddings, machine translation, attention mechanisms, and transformers.',
    thumbnailUrl: '',
    topics: ['NLP', 'Sentiment Analysis', 'Word2Vec', 'GloVe', 'Attention', 'BERT', 'Transformers', 'HuggingFace'],
    domain: 'NLP',
    difficulty: 'advanced',
    prerequisites: ['Deep Learning', 'Python', 'TensorFlow or PyTorch'],
    durationHours: 70,
    rating: 4.7,
    enrollmentCount: 200000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'HuggingFace NLP Course',
    provider: 'HuggingFace',
    url: 'https://huggingface.co/learn/nlp-course/',
    description: 'Official HuggingFace course: fine-tuning transformers, building NLP pipelines, training language models, and deploying with Spaces.',
    thumbnailUrl: '',
    topics: ['HuggingFace Transformers', 'BERT', 'GPT', 'Fine-Tuning', 'Tokenizers', 'Datasets', 'Inference API'],
    domain: 'NLP',
    difficulty: 'intermediate',
    prerequisites: ['Python', 'Basic Deep Learning'],
    durationHours: 30,
    rating: 4.8,
    enrollmentCount: 400000,
    isFree: true,
    language: 'English',
  },

  // ── Cloud Computing ──────────────────────────────────────────────────────────
  {
    title: 'AWS Certified Solutions Architect - Associate',
    provider: 'A Cloud Guru',
    url: 'https://acloudguru.com/course/aws-certified-solutions-architect-associate',
    description: 'Comprehensive prep for the SAA-C03 exam. Covers VPC, EC2, S3, RDS, Lambda, CloudFormation, IAM, and architectural best practices.',
    thumbnailUrl: '',
    topics: ['AWS', 'EC2', 'S3', 'RDS', 'Lambda', 'VPC', 'IAM', 'CloudFormation', 'Serverless'],
    domain: 'Cloud Computing',
    difficulty: 'intermediate',
    prerequisites: ['Basic networking', 'Linux basics'],
    durationHours: 42,
    rating: 4.7,
    enrollmentCount: 400000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Google Cloud Professional Data Engineer Certification',
    provider: 'Coursera (Google Cloud)',
    url: 'https://www.coursera.org/professional-certificates/gcp-data-engineering',
    description: 'Prepare for GCP Data Engineer exam: BigQuery, Pub/Sub, Dataflow, Dataproc, Cloud Storage, Vertex AI, and data pipeline design.',
    thumbnailUrl: '',
    topics: ['GCP', 'BigQuery', 'Pub/Sub', 'Dataflow', 'Dataproc', 'Vertex AI', 'Data Pipelines'],
    domain: 'Cloud Computing',
    difficulty: 'advanced',
    prerequisites: ['SQL', 'Python', 'Basic ML'],
    durationHours: 60,
    rating: 4.6,
    enrollmentCount: 100000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'Docker and Kubernetes: The Complete Guide',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/',
    description: 'Learn Docker, Kubernetes, and CI/CD pipelines from scratch. Containerize apps, deploy to AWS EKS, and set up GitHub Actions pipelines.',
    thumbnailUrl: '',
    topics: ['Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'AWS EKS', 'Microservices', 'Helm', 'Service Mesh'],
    domain: 'DevOps',
    difficulty: 'intermediate',
    prerequisites: ['Basic Linux', 'Any backend language'],
    durationHours: 22,
    rating: 4.7,
    enrollmentCount: 280000,
    isFree: false,
    language: 'English',
  },

  // ── TypeScript / Advanced JS ──────────────────────────────────────────────────
  {
    title: 'Understanding TypeScript',
    provider: 'Udemy',
    url: 'https://www.udemy.com/course/understanding-typescript/',
    description: 'Go from JavaScript to TypeScript. Covers types, generics, decorators, modules, namespaces, and using TypeScript with React, Node, and Next.',
    thumbnailUrl: '',
    topics: ['TypeScript', 'Generics', 'Decorators', 'Interfaces', 'Type Guards', 'Utility Types', 'React with TS'],
    domain: 'TypeScript',
    difficulty: 'intermediate',
    prerequisites: ['JavaScript'],
    durationHours: 22,
    rating: 4.7,
    enrollmentCount: 200000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'JavaScript: The Hard Parts',
    provider: 'Frontend Masters',
    url: 'https://frontendmasters.com/courses/javascript-hard-parts-v2/',
    description: 'Deep-dive into JavaScript core mechanics: execution context, closures, prototype chain, asynchronous programming, and the event loop.',
    thumbnailUrl: '',
    topics: ['JavaScript', 'Closures', 'Prototype Chain', 'Event Loop', 'Async/Await', 'Promises', 'Iterators', 'Generators'],
    domain: 'JavaScript',
    difficulty: 'intermediate',
    prerequisites: ['JavaScript Basics'],
    durationHours: 9,
    rating: 4.9,
    enrollmentCount: 120000,
    isFree: false,
    language: 'English',
  },

  // ── System Design / Career ────────────────────────────────────────────────────
  {
    title: 'Grokking the System Design Interview',
    provider: 'Educative.io',
    url: 'https://www.educative.io/courses/grokking-the-system-design-interview',
    description: 'In-depth system design interview prep. Design URL shorteners, social networks, ride-sharing apps, file storage, and streaming services.',
    thumbnailUrl: '',
    topics: ['System Design', 'Scalability', 'Load Balancing', 'Caching', 'Databases', 'Microservices', 'CAP Theorem'],
    domain: 'Software Engineering',
    difficulty: 'advanced',
    prerequisites: ['Backend development experience'],
    durationHours: 30,
    rating: 4.7,
    enrollmentCount: 180000,
    isFree: false,
    language: 'English',
  },
  {
    title: 'CS50: Introduction to Computer Science',
    provider: 'edX (Harvard)',
    url: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
    description: 'Harvard\'s legendary intro CS course. Covers C, Python, SQL, HTML/CSS/JavaScript, algorithms, data structures, and problem-solving.',
    thumbnailUrl: '',
    topics: ['C', 'Python', 'SQL', 'Algorithms', 'Data Structures', 'Memory Management', 'Web Development', 'Problem Solving'],
    domain: 'Computer Science',
    difficulty: 'beginner',
    prerequisites: [],
    durationHours: 100,
    rating: 4.9,
    enrollmentCount: 3000000,
    isFree: true,
    language: 'English',
  },
];

// ─── Embedding Helper (Using Gemini) ──────────────────────────────────────────
// ─── Embedding Helper (Using Gemini) ──────────────────────────────────────────
async function generateEmbedding(course) {
  const text = [
    course.title,
    course.description,
    course.domain,
    ...course.topics,
    course.difficulty,
    ...(course.prerequisites || []),
  ]
    .filter(Boolean)
    .join(' ');

  // 👇 USE GEMINI-EMBEDDING-001 HERE 👇
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  
  const result = await model.embedContent(text.substring(0, 8000));
  
  return result.embedding.values;
}

// ─── Sleep helper to respect API rate limits ──────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 EduPath Course Seeder');
  console.log('========================\n');

  // Connect to MongoDB
  console.log('📡 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ MongoDB connected.\n');

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < COURSES.length; i++) {
    const courseData = COURSES[i];
    console.log(`[${i + 1}/${COURSES.length}] Processing: "${courseData.title}"`);

    try {
      // Check if course already exists by URL
      const existing = await Course.findOne({ url: courseData.url });
      if (existing) {
        console.log(`  ⏭  Already exists — skipping.\n`);
        skipped++;
        continue;
      }

      // Generate embedding
      process.stdout.write('  🔄 Generating embedding… ');
      const embedding = await generateEmbedding(courseData);
      console.log(`done (${embedding.length} dims)`);

      // Save to DB
      const course = new Course({ ...courseData, embedding });
      await course.save();
      console.log(`  ✅ Saved: ${course._id}\n`);
      inserted++;

      // Rate-limit: ~1 request per second to avoid API limits
      if (i < COURSES.length - 1) {
        await sleep(1100);
      }
    } catch (err) {
      console.error(`  ❌ Error processing "${courseData.title}":`, err.message, '\n');
      errors++;
    }
  }

  console.log('\n========================');
  console.log('🌱 Seeding Complete!');
  console.log(`  ✅ Inserted : ${inserted}`);
  console.log(`  ⏭  Skipped  : ${skipped}`);
  console.log(`  ❌ Errors   : ${errors}`);
  console.log('========================\n');

  await mongoose.disconnect();
  console.log('📡 MongoDB disconnected. Goodbye!');
  process.exit(errors > 0 ? 1 : 0);
}

seed().catch((err) => {
  console.error('💥 Fatal seed error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
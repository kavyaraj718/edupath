require('dotenv').config();

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      return;
    }
    
    console.log("✅ Models your API key can access for Chat/JSON:\n");
    data.models.forEach(model => {
      // Filter for models that support text/chat generation
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${model.name.replace('models/', '')}`);
      }
    });
  } catch (err) {
    console.error("Failed to connect:", err);
  }
}

listModels();
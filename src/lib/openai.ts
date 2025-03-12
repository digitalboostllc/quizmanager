import OpenAI from "openai";
import { API_CONFIG } from "./config";

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OpenAI API key is not configured in environment variables');
  throw new Error('OpenAI API key is not configured');
}

console.log('🔑 OpenAI API Key format check:', {
  keyPrefix: process.env.OPENAI_API_KEY.substring(0, 8),
  keyLength: process.env.OPENAI_API_KEY.length
});

let openai: OpenAI;

try {
  console.log('🚀 Initializing OpenAI client...');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1",
    maxRetries: 3,
    timeout: API_CONFIG.OPENAI.TIMEOUT,
  });
  console.log('✅ OpenAI client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error);
  throw error;
}

// Test the connection
(async () => {
  try {
    console.log('🔄 Testing OpenAI connection...');
    const completion = await openai.chat.completions.create({
      model: API_CONFIG.OPENAI.DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a test assistant."
        },
        {
          role: "user",
          content: "Test connection.",
        }
      ],
      temperature: API_CONFIG.OPENAI.DEFAULT_TEMPERATURE,
      max_tokens: API_CONFIG.OPENAI.MAX_TOKENS,
    });

    if (completion.choices[0]?.message?.content) {
      console.log('✅ OpenAI connection test successful');
    } else {
      console.error('❌ OpenAI connection test failed: No content in response');
    }
  } catch (error) {
    console.error('❌ OpenAI connection test failed:', error);
  }
})();

export default openai; 
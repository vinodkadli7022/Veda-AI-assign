import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = 'AIzaSyDE2AM-TU6XAw1kt9lputvd89mBETcMolM';
  const ai = new GoogleGenAI({ apiKey });
  
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      console.log(`Testing key with ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: 'Hello',
      });
      console.log(`[SUCCESS] ${model}: ${response.text?.trim()}`);
    } catch (err: any) {
      console.error(`[ERROR] ${model}: ${err.message || err}`);
    }
  }
}

test();

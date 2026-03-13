import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
    Return ONLY the translated text, nothing else.
    
    Text: ${text}`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "Tarjima amalga oshmadi.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.";
  }
}

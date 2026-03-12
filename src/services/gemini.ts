import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIResponse(prompt: string, context?: string) {
  if (!prompt.trim()) return "";

  const systemInstruction = `Siz Umzo AI ismli aqlli yordamchisiz. 
  Foydalanuvchi savollariga aniq, foydali va do'stona javob bering. 
  Agar foydalanuvchi tarjima so'rasa, tarjima qiling. 
  Agar savol bersa, javob bering. 
  Javoblaringizni ChatGPT kabi mantiqiy va tushunarli qilib shakllantiring.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text || "Kechirasiz, javob topilmadi.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Xatolik yuz berdi. Iltimos qaytadan urunib ko'ring.";
  }
}

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  if (!text.trim()) return "";

  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
  Provide only the translated text without any explanations or additional context.
  
  Text: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Tarjima amalga oshmadi.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Xatolik yuz berdi. Iltimos qaytadan urunib ko'ring.";
  }
}

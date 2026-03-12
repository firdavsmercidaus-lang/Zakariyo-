import { GoogleGenAI } from "@google/genai";

export async function generateVideo(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': process.env.API_KEY || '',
      },
    });

    if (!response.ok) throw new Error("Failed to fetch video");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
}


import { GoogleGenAI, Type } from "@google/genai";

export interface BirthData {
  date: string;
  time: string;
  location: string;
}

export interface LocationSuggestion {
  city: string;
  country: string;
  fullName: string;
}

export const getDetectedLanguage = (): 'es' | 'en' => {
  const supported = ['es', 'en'];
  const preferred = navigator.languages || [navigator.language || 'en'];
  for (const lang of preferred) {
    const code = lang.split('-')[0].toLowerCase();
    if (supported.includes(code)) return code as 'es' | 'en';
  }
  return 'en';
};

export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (query.trim().length < 3) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const lang = getDetectedLanguage();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [{
        text: `Find exactly 5 real-world cities that match the input: "${query}". Respond in ${lang === 'es' ? 'Spanish' : 'English'}.`
      }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING },
            country: { type: Type.STRING },
            fullName: { type: Type.STRING }
          },
          required: ["city", "country", "fullName"]
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateChartImage = async (data: BirthData): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A mystical, high-end, aesthetic natal chart illustration. Dark cosmic background with nebulae in deep purple and indigo. Gold celestial lines connecting zodiac symbols. Central sun-like glow. The chart should represent a birth at ${data.location} on ${data.date} at ${data.time}. Artistic style: Modern Spiritualism, 4K, beautiful textures.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const analyzeChart = async (input: string | BirthData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langCode = getDetectedLanguage();
  const languageName = langCode === 'es' ? 'Spanish' : 'English';

  const baseSystemPrompt = `
    Act as a master astrologer. Your tone is mystical, insightful, and empowering.
    Format your response using Markdown (H1 for title, H2 for major sections, H3 for sub-points, and bullet points for lists).
    Use **bold** text for key astronomical findings.
    IMPORTANT: If the provided image is NOT a natal chart or is too blurry to read, you MUST start your response with the exact code "ERROR_INVALID_CHART".
    Write everything in ${languageName}.
    START the response with "# Your Cosmic Map".
  `;

  let parts: any[] = typeof input === 'string' 
    ? [{ inlineData: { mimeType: 'image/png', data: input } }, { text: `${baseSystemPrompt} Analyze this natal chart image.` }]
    : [{ text: `${baseSystemPrompt} Analyze birth details: Date ${input.date}, Time ${input.time}, Location ${input.location}.` }];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
  });
  return response.text || "";
};

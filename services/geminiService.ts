
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

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

/**
 * Robustly detects the user's preferred language from the browser.
 */
export const getDetectedLanguage = (): 'es' | 'en' => {
  const supported = ['es', 'en'];
  const preferred = navigator.languages || [navigator.language || 'en'];
  
  for (const lang of preferred) {
    const code = lang.split('-')[0].toLowerCase();
    if (supported.includes(code)) return code as 'es' | 'en';
  }
  
  return 'en';
};

/**
 * Uses Gemini to search for valid locations based on user input.
 * Optimized for accuracy in City, Region/State, Country format.
 */
export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (query.trim().length < 3) return [];
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const lang = getDetectedLanguage();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [{
        text: `Find exactly 5 real-world cities that match the input: "${query}". 
               Provide the city name and the country name clearly.
               The "fullName" property MUST be in the format "City, Country".
               Respond in ${lang === 'es' ? 'Spanish' : 'English'}.`
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
            fullName: { type: Type.STRING, description: "Highly precise format: City, Country (e.g., Madrid, Spain)" }
          },
          required: ["city", "country", "fullName"]
        }
      }
    }
  });

  try {
    const text = response.text;
    return JSON.parse(text || '[]');
  } catch (e) {
    console.error("Error parsing locations", e);
    return [];
  }
};

export const analyzeChart = async (input: string | BirthData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const langCode = getDetectedLanguage();
  const languageName = langCode === 'es' ? 'Spanish' : 'English';
  const locationLabel = langCode === 'es' ? 'Ubicación de Nacimiento' : 'Birth Location';

  const baseSystemPrompt = `
    Act as a world-class expert astrologer with deep knowledge in Western Natal Astrology.
    Use a mystical yet professional and empowering tone.
    Format the output with clear headers and bullet points. Use Markdown for styling.
    IMPORTANT: You MUST write the entire response in ${languageName}.
    
    REPORT STRUCTURE RULE:
    - START the report with a header (H1) like "# Celestial Analysis".
    - IMMEDIATELY after the header, add a blockquote or a prominent line stating:
      "**${locationLabel}:** ${typeof input === 'string' ? 'Visual Scan' : input.location}"
    - ENSURE the country name is included after the city name in that line.
  `;

  let parts: any[];

  if (typeof input === 'string') {
    parts = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: input,
        },
      },
      { 
        text: `${baseSystemPrompt}
        Analyze the provided birth chart image. 
        1. Identify the Big Three: Sun, Moon, and Rising signs.
        2. Describe core personality traits.
        3. Look for major aspects between personal planets.
        4. Provide insights into Career, Relationships, and Life Purpose.` 
      },
    ];
  } else {
    parts = [{
      text: `${baseSystemPrompt}
      The user has provided their birth details:
      - Date: ${input.date}
      - Time: ${input.time}
      - Location: ${input.location}

      Based on these details:
      1. Calculate/Estimate the Big Three (Sun, Moon, and Rising sign).
      2. Provide a deep interpretation of the personality.
      3. Discuss the energetic signature of this specific birth time and location.
      4. Include detailed sections for Sun, Moon, and Rising interpretations.`
    }];
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
    });

    const text = response.text;
    if (!text) {
      const errorMsg = langCode === 'es' ? "Las estrellas guardan silencio. Por favor, intenta de nuevo." : "The stars are silent. Please try again.";
      throw new Error(errorMsg);
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const fallbackMsg = langCode === 'es' ? "Error al consultar los cielos." : "Failed to consult the heavens.";
    throw new Error(error.message || fallbackMsg);
  }
};


import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export interface BirthData {
  date: string;
  time: string;
  location: string;
}

export const analyzeChart = async (input: string | BirthData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const baseSystemPrompt = `
    Act as a world-class expert astrologer with deep knowledge in Western Natal Astrology.
    Use a mystical yet professional and empowering tone.
    Format the output with clear headers and bullet points. Use Markdown for styling.
  `;

  let contents: any;

  if (typeof input === 'string') {
    // Image Analysis
    contents = {
      parts: [
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
      ],
    };
  } else {
    // Manual Data Analysis
    contents = {
      contents: [{
        parts: [{
          text: `${baseSystemPrompt}
          The user has provided their manual birth details:
          - Date: ${input.date}
          - Time: ${input.time}
          - Location: ${input.location}

          Based on these details, please:
          1. Calculate/Estimate the Big Three (Sun, Moon, and Rising sign).
          2. Provide a deep interpretation of the personality based on the signs and likely house placements.
          3. Discuss the energetic signature of this birth time.
          4. Provide sections on:
             - Core Essence (Sun)
             - Emotional Landscape (Moon)
             - The Mask You Wear (Rising)
             - Destined Path & Career
             - Relationship Needs`
        }]
      }]
    };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      ...(typeof input === 'string' ? contents : { contents: contents.contents }),
    });

    if (!response.text) {
      throw new Error("The stars are silent. Please try again.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to consult the heavens.");
  }
};

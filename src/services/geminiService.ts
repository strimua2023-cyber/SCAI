import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SocialLink {
  platform: string;
  url: string;
}

export interface FaceAnalysisResult {
  name: string;
  age: string;
  id: string;
  status: string;
  match: string;
  bio: string;
  socialLinks: SocialLink[];
}

export async function analyzeFace(base64Image: string): Promise<FaceAnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: "Analyze the face in this image. Perform a high-precision biometric scan simulation. Provide a profile including Name, Age, ID number (format ID-XXXX), Status (e.g., Active, Suspicious, Cleared), Match percentage (e.g., 99.9%), and a Brief Biography (professional background, notable achievements, or identifying traits). If it's a public figure, provide accurate real-world data and real social media links. If not identifiable, generate a highly realistic professional profile based on visual cues.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            age: { type: Type.STRING },
            id: { type: Type.STRING },
            status: { type: Type.STRING },
            match: { type: Type.STRING },
            bio: { type: Type.STRING },
            socialLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["platform", "url"]
              }
            }
          },
          required: ["name", "age", "id", "status", "match", "bio", "socialLinks"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as FaceAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

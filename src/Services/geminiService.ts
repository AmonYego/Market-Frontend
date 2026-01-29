import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateProductDescription = async (
  title: string,
  category: string,
  condition: string
): Promise<string> => {
  try {
    const apiKey = (import.meta as any).env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GOOGLE_API_KEY is missing");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Write a compelling, concise 2-sentence sales description for a campus marketplace listing.
Product: ${title}
Category: ${category}
Condition: ${condition}
Target Audience: Fellow university students at DeKUT.
Tone: Helpful, honest, and persuasive.`;

    const result = await model.generateContent(prompt);

    return result.response.text() || "No description generated.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Failed to generate AI description. Please write manually.";
  }
};

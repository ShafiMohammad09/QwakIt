import { GoogleGenAI } from "@google/genai";

// Use environment variable or fallback to user-provided key
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCwDnMdH6F-ogXolwXt0GWXKV8ec4qk080";
const ai = new GoogleGenAI({ apiKey });

export interface MessageGenerationData {
  resumeContent: string;
  profileName: string;
  profileHeadline: string;
  profileCompany: string;
  additionalInstructions?: string;
}

export async function generatePersonalizedMessage(data: MessageGenerationData): Promise<string> {
  // Check if we have a valid API key
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-api-key-here') {
    // Return a template message when no API key is available
    return `Hi ${data.profileName.split(' ')[0]},

I noticed your background in ${data.profileCompany} and thought you might be interested in connecting. I'd love to learn more about your experience in ${data.profileHeadline.toLowerCase()}.

Looking forward to connecting!

Best regards`;
  }

  const systemPrompt = `You are an expert at writing personalized LinkedIn outreach messages. 
Generate a professional, friendly, and concise LinkedIn message based on the following information.

Guidelines:
- Keep the message between 50-150 words
- Be genuine and professional
- Mention specific details about their profile when relevant
- Avoid being overly salesy or pushy
- End with a clear but soft call to action
- Do not use placeholder text like [Name] - use actual names provided
- Make it feel personal and authentic

The message should sound natural and human-written.`;

  const prompt = `Create a personalized LinkedIn message for:

Profile Information:
- Name: ${data.profileName}
- Headline/Position: ${data.profileHeadline}
- Company: ${data.profileCompany}

Sender's Background (from resume):
${data.resumeContent.substring(0, 1000)} // Limit to avoid token limits

Additional Instructions: ${data.additionalInstructions || "Keep it professional and friendly"}

Generate only the message text, no subject line or additional formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: prompt }] }
      ],
    });

    const message = response.text?.trim();
    if (!message) {
      throw new Error("Empty response from AI model");
    }

    return message;
  } catch (error) {
    console.error("AI message generation failed:", error);
    // Return a fallback message if AI fails
    return `Hi ${data.profileName.split(' ')[0]},

I came across your profile and was impressed by your work at ${data.profileCompany}. I'd love to connect and learn more about your experience in ${data.profileHeadline.toLowerCase()}.

Best regards`;
  }
}

import { GoogleGenAI } from "@google/genai";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePattern = async (promptDescription: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use flash-image for general pattern generation as it is more robust without specific paid key flows
  const model = "gemini-2.5-flash-image"; 
  
  const fullPrompt = `Generate a seamless, tileable wrapping paper pattern. 
  Style: Elegant, high-resolution, vector-style flat design. 
  Content: ${promptDescription}. 
  Background: Pure white (#FFFFFF) or very light cream. 
  The pattern must be seamlessly repeatable.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          // imageSize is not supported in gemini-2.5-flash-image
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Pattern generation failed", error);
    throw error;
  }
};

export const processSubjectImage = async (
  imageUrl: string, 
  options: { addHat: boolean; hatType: string; removeBackground: boolean }
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash-image"; // Fast model for edits

  // Fetch the blob from the local object URL to get base64
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const base64Data = await blobToBase64(blob);

  let prompt = "Isolate the main subject in the center of the image. Change the background to pure solid white (#FFFFFF).";
  
  if (options.addHat) {
    prompt += ` Add a festive ${options.hatType} to the subject's head naturally.`;
  }
  
  prompt += " Ensure high quality, sharp edges, and sticker-like appearance.";

  try {
    const apiResponse = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: blob.type, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    const part = apiResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No processed image returned");
  } catch (error) {
    console.error("Subject processing failed", error);
    throw error;
  }
};
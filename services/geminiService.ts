
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { AspectRatio } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const handleGeminiError = (error: any, context: string): Error => {
  console.error(`Error in ${context}:`, error);

  let message = `An unknown error occurred during ${context}. Please try again later.`;

  if (error instanceof Error) {
    if (error.message.includes('SAFETY')) {
      message = `Your request was blocked due to safety policies. Please modify your prompt and try again.`;
    } else if (error.message.includes('API_KEY')) {
      message = `There is an issue with the API key. Please ensure it is configured correctly.`;
    } else if (error.message.includes('400')) {
        message = `The request was invalid. For image generation/editing, this can happen with an unsupported image format or a malformed prompt. Please check your inputs.`;
    } else if (error.message.includes('500') || error.message.includes('503')) {
        message = `The service is temporarily unavailable. Please wait a few moments and try again.`;
    } else if (error.message.toLowerCase().includes('resource exhausted')) {
        message = `You have exceeded your usage quota. Please check your billing account or try again later.`
    }
    else {
      message = error.message;
    }
  }
  
  return new Error(message);
};


export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio,
      },
    });
    
    if (!response.generatedImages?.[0]?.image?.imageBytes) {
      throw new Error("The model did not return an image. Please try a different prompt.");
    }
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    throw handleGeminiError(error, "image generation");
  }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: { data: base64Image, mimeType },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("The model did not return an image for this edit. Please try a different prompt.");
  } catch (error) {
    throw handleGeminiError(error, "image editing");
  }
};

export const generateImageForAnalysis = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data; // Return raw base64
      }
    }
    throw new Error("The model did not return an image from the generation process. Please adjust your prompt.");
  } catch (error) {
    throw handleGeminiError(error, "image generation for analysis");
  }
};

export const analyzeGeneratedImage = async (base64Image: string, prompt: string): Promise<{ match: boolean, reason: string }> => {
  try {
    const analysisPrompt = `Analyze the provided image and determine if it accurately represents the following user prompt. Provide your response as a JSON object with two keys: "match" (a boolean, true if it matches, false otherwise) and "reason" (a brief string explaining your decision). Do not include any other text or markdown formatting in your response. User Prompt: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: analysisPrompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text.trim();
    // In case the model wraps the JSON in markdown
    const cleanedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanedJson);
  } catch (error) {
     if (error instanceof SyntaxError) {
        console.error("JSON parsing error during analysis:", error);
        throw new Error("The model's analysis response was not valid. This can sometimes happen with complex prompts. Please try generating a new image.");
    }
    throw handleGeminiError(error, "image analysis");
  }
};

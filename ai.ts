import { GoogleGenAI } from "@google/genai";
import { ComponentType, StyleConfig } from './types';

// Lazy initialization to prevent module-level crashes
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    let apiKey = '';
    
    // Safely attempt to get API Key
    try {
      if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || '';
      }
    } catch (e) {
      console.warn("Failed to access process.env");
    }

    if (!apiKey) {
      console.warn("API_KEY is missing. AI features will not work.");
      // Return a mock object to prevent crashes, but AI calls will fail gracefully later or do nothing
      return {
        models: {
          generateContent: async () => ({ text: "{}" })
        }
      } as unknown as GoogleGenAI;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const generateComponentStyles = async (prompt: string, currentProps: any, type: ComponentType) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Updated to a reliable model version
      contents: `
        You are an expert React UI designer. 
        Update the style properties for a "${type}" component based on this user request: "${prompt}".
        
        Current Props: ${JSON.stringify(currentProps)}
        
        Return ONLY the updated JSON object for the "props". 
        Do not change logic props, only style related ones (className, style, text content if applicable).
        Use Tailwind CSS classes in 'className' for styling.
      `,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Error:", e);
    return null;
  }
};

export const generateResponsiveVariant = async (
  desktopStyle: StyleConfig, 
  viewport: 'tablet' | 'mobile'
): Promise<StyleConfig | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `
        You are an expert Responsive Web Designer.
        Convert the following Desktop style configuration into a ${viewport}-optimized version.
        
        Rules:
        1. If flexDirection is 'row', change it to 'col' for mobile (Smart Stacking).
        2. Adjust widths to 'full' if they are fixed or fractional.
        3. Adjust padding and gaps to be smaller for mobile/tablet.
        4. Return ONLY the JSON object for the new StyleConfig.
        
        Desktop Config: ${JSON.stringify(desktopStyle)}
      `,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Responsive Error:", e);
    return null;
  }
};
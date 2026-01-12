import { GoogleGenAI } from "@google/genai";
import { ComponentType, StyleConfig } from './types';
import { API_BASE_URL } from './constants';

// Helper to get client-side instance if backend fails
const getClientAI = () => {
  // @ts-ignore - Process is shimmed in index.html for this environment
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY; 
  if (!apiKey) throw new Error("API Key not found in environment. Please set it in index.html or environment variables.");
  return new GoogleGenAI({ apiKey });
};

export const generateComponentStyles = async (prompt: string, currentProps: any, type: ComponentType) => {
  // 1. Try Backend (Secure)
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'style',
        prompt,
        currentProps,
        type
      })
    });

    if (!response.ok) {
        throw new Error('Backend unavailable');
    }

    return await response.json();
  } catch (backendError) {
    console.warn("Backend unavailable, falling back to client-side AI generation.");
    
    // 2. Fallback to Client-Side (Dev/Offline)
    try {
        const ai = getClientAI();
        const contents = `
        You are an expert React UI designer. 
        Update the style properties for a "${type}" component based on this user request: "${prompt}".
        Current Props: ${JSON.stringify(currentProps)}
        Return ONLY the updated JSON object for the "props". 
        Do not change logic props, only style related ones.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (clientError) {
        console.error("AI Generation failed (Both Backend and Client):", clientError);
        return null;
    }
  }
};

export const generateResponsiveVariant = async (
  desktopStyle: StyleConfig, 
  viewport: 'tablet' | 'mobile'
): Promise<StyleConfig | null> => {
  // 1. Try Backend (Secure)
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'responsive',
        currentProps: desktopStyle, // sending style config as props payload
        prompt: viewport // context
      })
    });

    if (!response.ok) {
        throw new Error('Backend unavailable');
    }

    return await response.json();
  } catch (backendError) {
    console.warn("Backend unavailable, falling back to client-side AI generation.");

    // 2. Fallback to Client-Side (Dev/Offline)
    try {
        const ai = getClientAI();
        const contents = `
        You are an expert Responsive Web Designer.
        Convert the following Desktop style configuration into a mobile/tablet optimized version.
        Desktop Config: ${JSON.stringify(desktopStyle)}
        Return ONLY the JSON object for the new StyleConfig.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text);
    } catch (clientError) {
        console.error("AI Generation failed:", clientError);
        return null;
    }
  }
};
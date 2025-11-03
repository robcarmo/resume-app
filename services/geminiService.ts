import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import OpenAI from "openai";
import type { ResumeData, CustomStyles } from '../types';

// AI Provider type
type AIProvider = 'gemini' | 'openai';

// Get API keys from environment (FIXED for Vite)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Determine which provider to use (prioritize OpenAI if key is available)
const getProvider = (): AIProvider => {
    if (OPENAI_API_KEY) return 'openai';
    if (GEMINI_API_KEY) return 'gemini';
    throw new Error('No API key found. Please set VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY in your .env file.');
};

// Initialize AI clients
const geminiClient = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true }) : null;

export const parseResumeText = async (text: string): Promise<ResumeData> => {
    const provider = getProvider();
    
    const prompt = `Parse this resume text and extract structured data. Return ONLY valid JSON with this exact structure:
    {
        "personalInfo": {
            "name": "string",
            "email": "string", 
            "phone": "string",
            "location": "string",
            "linkedin": "string",
            "website": "string"
        },
        "professionalSummary": "string",
        "experience": [
            {
                "company": "string",
                "position": "string", 
                "duration": "string",
                "description": "string"
            }
        ],
        "education": [
            {
                "institution": "string",
                "degree": "string",
                "year": "string"
            }
        ],
        "skills": ["string"],
        "certifications": ["string"]
    }

    Resume text: ${text}`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            response = result.response.text();
        } else {
            throw new Error('No AI client available');
        }

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error parsing resume:', error);
        throw new Error('Failed to parse resume. Please check your API key configuration.');
    }
};

export const improveResumeContent = async (resumeData: ResumeData, improvements: string): Promise<ResumeData> => {
    const provider = getProvider();
    
    const prompt = `Improve this resume data based on the requested improvements. Focus on enhancing ALL sections including professional summary, experience descriptions, and any other content mentioned in the improvements request.

    Current resume data: ${JSON.stringify(resumeData, null, 2)}
    
    Requested improvements: ${improvements}
    
    Return ONLY valid JSON with the same structure but improved content. Make sure to enhance:
    - Professional summary if mentioned
    - Experience descriptions and bullet points if mentioned  
    - Any other sections specifically requested
    - Keep all original structure and field names exactly the same`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            response = result.response.text();
        } else {
            throw new Error('No AI client available');
        }

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error improving resume:', error);
        throw new Error('The request to the AI service failed due to an API key issue. Please contact support.');
    }
};

export const generateStyles = async (preferences: string): Promise<CustomStyles> => {
    const provider = getProvider();
    
    const prompt = `Generate CSS styles for a resume based on these preferences: ${preferences}
    
    Return ONLY valid JSON with this structure:
    {
        "primaryColor": "#hexcolor",
        "secondaryColor": "#hexcolor", 
        "fontFamily": "font-name",
        "fontSize": "size",
        "spacing": "spacing-value",
        "layout": "layout-type"
    }`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            response = result.response.text();
        } else {
            throw new Error('No AI client available');
        }

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating styles:', error);
        throw new Error('Failed to generate styles. Please check your API key configuration.');
    }
};

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { ResumeData, CustomStyles } from '../types';

// AI Provider type
export type AIProvider = 'gemini' | 'openai' | 'ollama-local' | 'ollama-cloud';

// Get configuration from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro';

// Ollama configuration
const OLLAMA_ENABLED = import.meta.env.VITE_OLLAMA_ENABLED === 'true';
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3:4b';
const OLLAMA_CLOUD_URL = import.meta.env.VITE_OLLAMA_CLOUD_URL || '';
const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY || '';
// Support multiple Ollama models (comma-separated)
const OLLAMA_MODELS_STRING = import.meta.env.VITE_OLLAMA_MODELS || '';
const OLLAMA_MODELS = OLLAMA_MODELS_STRING
    ? OLLAMA_MODELS_STRING.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0)
    : [OLLAMA_MODEL];

// Cloud models (separate from local)
const OLLAMA_CLOUD_MODELS_STRING = import.meta.env.VITE_OLLAMA_CLOUD_MODELS || '';
const OLLAMA_CLOUD_MODELS = OLLAMA_CLOUD_MODELS_STRING
    ? OLLAMA_CLOUD_MODELS_STRING.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0)
    : [];

console.log('Ollama config loaded:', { OLLAMA_ENABLED, OLLAMA_MODELS, OLLAMA_MODEL, OLLAMA_CLOUD_MODELS });

// Runtime provider state (can be changed via UI)
let currentProvider: AIProvider | null = null;
let currentModel: string | null = null;

// Get available providers based on env config
export const getAvailableProviders = (): { provider: AIProvider; label: string; models?: string[] }[] => {
    const providers = [];
    
    if (OLLAMA_ENABLED) {
        providers.push({ provider: 'ollama-local' as AIProvider, label: 'Ollama (Local)', models: OLLAMA_MODELS });
    }
    if (OLLAMA_CLOUD_URL && OLLAMA_API_KEY && OLLAMA_CLOUD_MODELS.length > 0) {
        providers.push({ provider: 'ollama-cloud' as AIProvider, label: 'Ollama (Cloud)', models: OLLAMA_CLOUD_MODELS });
    }
    if (OPENAI_API_KEY) {
        providers.push({ provider: 'openai' as AIProvider, label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] });
    }
    if (GEMINI_API_KEY) {
        providers.push({ provider: 'gemini' as AIProvider, label: 'Google Gemini', models: ['gemini-2.5-pro', 'gemini-2.5-flash-image', 'gemini-flash-latest', 'gemini-1.5-pro', 'gemini-1.5-flash'] });
    }
    
    return providers;
};

// Get/Set current provider (persists to localStorage)
export const getCurrentProvider = (): AIProvider => {
    if (currentProvider) return currentProvider;
    
    // Try to load from localStorage
    const saved = localStorage.getItem('ai_provider');
    if (saved) {
        const providers = getAvailableProviders();
        if (providers.some(p => p.provider === saved)) {
            currentProvider = saved as AIProvider;
            return currentProvider;
        }
    }
    
    // Default: use first available provider
    const providers = getAvailableProviders();
    if (providers.length === 0) {
        throw new Error('No AI provider configured. Please set up at least one provider in your .env file.');
    }
    
    currentProvider = providers[0].provider;
    return currentProvider;
};

export const setCurrentProvider = (provider: AIProvider, model?: string) => {
    currentProvider = provider;
    if (model) currentModel = model;
    localStorage.setItem('ai_provider', provider);
    if (model) localStorage.setItem('ai_model', model);
};

export const getCurrentModel = (): string => {
    const provider = getCurrentProvider();
    const providers = getAvailableProviders();
    const providerInfo = providers.find(p => p.provider === provider);
    const availableModels = providerInfo?.models || [];
    
    // Check if current model is valid for this provider
    if (currentModel && availableModels.includes(currentModel)) {
        return currentModel;
    }
    
    // Check if saved model is valid for this provider
    const saved = localStorage.getItem('ai_model');
    if (saved && availableModels.includes(saved)) {
        currentModel = saved;
        return saved;
    }
    
    // Return first available model for this provider
    const defaultModel = availableModels[0] || OLLAMA_MODEL;
    currentModel = defaultModel;
    localStorage.setItem('ai_model', defaultModel);
    
    console.log('getCurrentModel: defaulting to', defaultModel, 'for provider', provider);
    return defaultModel;
};

// Helper: Convert OpenAI chat messages to Ollama prompt format
const chatToOllamaPrompt = (messages: Array<{role: string; content: string}>): string => {
    return messages.map(m => m.content).join('\n\n');
};

// Helper: Call Ollama /api/generate endpoint
const callOllamaGenerate = async (baseURL: string, apiKey: string, model: string, prompt: string, temperature: number): Promise<string> => {
    const response = await fetch(`${baseURL}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: temperature
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response || '';
};

// Initialize AI clients
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY }) : null;
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true }) : null;
const ollamaLocalClient = OLLAMA_ENABLED ? new OpenAI({ 
    baseURL: `${OLLAMA_BASE_URL}/v1`,
    apiKey: 'ollama',
    dangerouslyAllowBrowser: true 
}) : null;
// Note: Ollama Cloud uses /api/generate endpoint, not OpenAI-compatible /v1/chat/completions
const ollamaCloudClient = null; // We'll use fetch directly for Ollama Cloud

// Helper to generate unique IDs
const generateId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

export const parseResumeText = async (text: string): Promise<ResumeData> => {
    const provider = getCurrentProvider();
    const model = getCurrentModel();
    
    const prompt = `Parse this resume text and extract structured data. Return ONLY valid JSON with this exact structure:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "website": "https://website.com",
    "location": "City, State",
    "summary": "Professional summary or objective"
  },
  "experience": [
    {
      "jobTitle": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Jan 2020",
      "endDate": "Present",
      "description": [
        "Achievement or responsibility bullet point 1",
        "Achievement or responsibility bullet point 2"
      ],
      "keyTech": "Technologies used (optional)"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "City, State",
      "gradDate": "May 2020"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name"
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "years": 5
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "link": "https://project-link.com"
    }
  ],
  "keyArchitecturalProjects": []
}

IMPORTANT:
- description must be an array of strings (bullet points)
- years must be a number (0 if unknown)
- Extract all information from the resume
- If a field is missing, use empty string or empty array
- Do not add id fields - they will be added automatically

Resume text:
${text}`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'ollama-local' && ollamaLocalClient) {
            const completion = await ollamaLocalClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'ollama-cloud' && OLLAMA_CLOUD_URL && OLLAMA_API_KEY) {
            response = await callOllamaGenerate(OLLAMA_CLOUD_URL, OLLAMA_API_KEY, model, prompt, 0.3);
        } else if (provider === 'gemini' && geminiClient) {
            const geminiModel = geminiClient.getGenerativeModel({ 
                model: model,
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const result = await geminiModel.generateContent(prompt);
            response = result.response.text();
        } else {
            throw new Error('No AI client available');
        }

        // Parse JSON response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Add IDs to all array items
        const resumeData: ResumeData = {
            personalInfo: parsed.personalInfo || {
                name: '',
                email: '',
                phone: '',
                website: '',
                location: '',
                summary: ''
            },
            experience: (parsed.experience || []).map((exp: any, idx: number) => ({
                id: generateId('exp', idx),
                jobTitle: exp.jobTitle || '',
                company: exp.company || '',
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                description: Array.isArray(exp.description) ? exp.description : [exp.description || ''],
                keyTech: exp.keyTech || ''
            })),
            education: (parsed.education || []).map((edu: any, idx: number) => ({
                id: generateId('edu', idx),
                degree: edu.degree || '',
                institution: edu.institution || '',
                location: edu.location || '',
                gradDate: edu.gradDate || ''
            })),
            certifications: (parsed.certifications || []).map((cert: any, idx: number) => ({
                id: generateId('cert', idx),
                name: cert.name || ''
            })),
            skills: (parsed.skills || []).map((skill: any, idx: number) => ({
                id: generateId('skill', idx),
                name: skill.name || '',
                years: typeof skill.years === 'number' ? skill.years : 0
            })),
            projects: (parsed.projects || []).map((proj: any, idx: number) => ({
                id: generateId('proj', idx),
                name: proj.name || '',
                description: proj.description || '',
                link: proj.link || ''
            })),
            keyArchitecturalProjects: (parsed.keyArchitecturalProjects || []).map((proj: any, idx: number) => ({
                id: generateId('arch-proj', idx),
                name: proj.name || '',
                description: proj.description || '',
                link: proj.link || ''
            }))
        };

        return resumeData;
    } catch (error) {
        console.error('Error parsing resume:', error);
        throw new Error(`Failed to parse resume with ${provider}. Please check your API key configuration.`);
    }
};

export const improveResumeContent = async (resumeData: ResumeData, improvements: string): Promise<ResumeData> => {
    const provider = getCurrentProvider();
    const model = getCurrentModel();
    
    const prompt = `You are an expert resume writer. Improve this resume data based on the requested improvements.

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

REQUESTED IMPROVEMENTS:
${improvements}

INSTRUCTIONS:
1. Focus on improving the Professional Summary (personalInfo.summary) and Experience descriptions
2. Make ALL experience bullet points more impactful with action verbs and quantifiable results
3. Keep the exact same JSON structure - do not change field names or types
4. Preserve all IDs exactly as they are
5. description must remain an array of strings
6. Make substantial improvements - don't just make minor tweaks
7. If the user asks to improve specific sections, focus on those but still enhance everything
8. Keep sections reasonable length - PDF will keep sections together on pages, so avoid making single sections too long

Return ONLY valid JSON with the improved content.`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'ollama-local' && ollamaLocalClient) {
            const completion = await ollamaLocalClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'ollama-cloud' && ollamaCloudClient) {
            const completion = await ollamaCloudClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const geminiModel = geminiClient.getGenerativeModel({ 
                model: model,
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const result = await geminiModel.generateContent(prompt);
            response = result.response.text();
        } else {
            throw new Error('No AI client available');
        }

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        const improved = JSON.parse(jsonMatch[0]);
        
        // Ensure description arrays are preserved
        if (improved.experience) {
            improved.experience = improved.experience.map((exp: any) => ({
                ...exp,
                description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
            }));
        }

        return improved as ResumeData;
    } catch (error) {
        console.error('Error improving resume:', error);
        throw new Error(`Failed to improve resume with ${provider}. Please try again.`);
    }
};

export const generateStyles = async (preferences: string): Promise<CustomStyles> => {
    const provider = getCurrentProvider();
    const model = getCurrentModel();
    
    const prompt = `Generate Tailwind CSS class names for a resume based on these preferences: ${preferences}
    
Return ONLY valid JSON with this structure:
{
  "container": "tailwind classes",
  "header": "tailwind classes",
  "name": "tailwind classes",
  "contactInfo": "tailwind classes",
  "summary": "tailwind classes",
  "sectionTitle": "tailwind classes",
  "itemTitle": "tailwind classes",
  "itemSubtitle": "tailwind classes",
  "listItem": "tailwind classes",
  "skillItem": "tailwind classes"
}`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'ollama-local' && ollamaLocalClient) {
            const completion = await ollamaLocalClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'ollama-cloud' && ollamaCloudClient) {
            const completion = await ollamaCloudClient.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const geminiModel = geminiClient.getGenerativeModel({ 
                model: model,
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const result = await geminiModel.generateContent(prompt);
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
        throw new Error(`Failed to generate styles with ${provider}.`);
    }
};
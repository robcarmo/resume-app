import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import type { ResumeData, CustomStyles } from '../types';

// AI Provider type
type AIProvider = 'gemini' | 'openai';

// Get API keys from environment (FIXED for Vite)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-pro';

// Determine which provider to use (prioritize OpenAI if key is available)
const getProvider = (): AIProvider => {
    if (OPENAI_API_KEY) return 'openai';
    if (GEMINI_API_KEY) return 'gemini';
    throw new Error('No API key found. Please set VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY in your .env file.');
};

// Initialize AI clients
const geminiClient = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true }) : null;

// Helper to generate unique IDs
const generateId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

export const parseResumeText = async (text: string): Promise<ResumeData> => {
    const provider = getProvider();
    
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
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const model = geminiClient.getGenerativeModel({ 
                model: GEMINI_MODEL,
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const result = await model.generateContent(prompt);
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
    const provider = getProvider();
    
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

Return ONLY valid JSON with the improved content.`;

    try {
        let response: string;
        
        if (provider === 'openai' && openaiClient) {
            const completion = await openaiClient.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const model = geminiClient.getGenerativeModel({ 
                model: GEMINI_MODEL,
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const result = await model.generateContent(prompt);
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
    const provider = getProvider();
    
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
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                response_format: { type: "json_object" }
            });
            response = completion.choices[0]?.message?.content || '';
        } else if (provider === 'gemini' && geminiClient) {
            const model = geminiClient.getGenerativeModel({ 
                model: GEMINI_MODEL,
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
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
        throw new Error(`Failed to generate styles with ${provider}.`);
    }
};
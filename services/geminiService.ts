import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { ResumeData, CustomStyles } from '../types';

// Initialize with Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Retry configuration
interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};

// Utility function to sleep for a specified duration
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
    let lastError: Error | unknown;
    let delayMs = config.initialDelayMs;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Don't retry on final attempt
            if (attempt === config.maxRetries) {
                break;
            }

            // Check if error is retryable (network errors, rate limits, temporary failures)
            const isRetryable = isRetryableError(error);
            if (!isRetryable) {
                // If error is not retryable (e.g., authentication, invalid input), fail immediately
                throw error;
            }

            console.warn(`API call failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delayMs}ms...`, error);
            
            await sleep(delayMs);
            
            // Exponential backoff with max delay cap
            delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
        }
    }

    throw lastError;
}

// Determine if an error is retryable
function isRetryableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorMessage = 'message' in error ? String(error.message).toLowerCase() : '';
    
    // Retry on network errors, rate limits, and temporary failures
    const retryablePatterns = [
        'network',
        'timeout',
        'econnreset',
        'enotfound',
        'rate limit',
        'too many requests',
        'service unavailable',
        '503',
        '429',
        'temporarily unavailable',
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

const styleSchema = {
    type: Type.OBJECT,
    properties: {
        container: { type: Type.STRING, description: "Tailwind classes for the main resume container.", nullable: true },
        header: { type: Type.STRING, description: "Tailwind classes for the header section with name and contact info.", nullable: true },
        name: { type: Type.STRING, description: "Tailwind classes for the person's name.", nullable: true },
        contactInfo: { type: Type.STRING, description: "Tailwind classes for the contact info block.", nullable: true },
        summary: { type: Type.STRING, description: "Tailwind classes for the summary/profile section.", nullable: true },
        section: { type: Type.STRING, description: "Tailwind classes for a generic resume section (like Experience, Education).", nullable: true },
        sectionTitle: { type: Type.STRING, description: "Tailwind classes for the title of a section.", nullable: true },
        itemHeader: { type: Type.STRING, description: "Tailwind classes for the header of an item (e.g., job title and company).", nullable: true },
        itemTitle: { type: Type.STRING, description: "Tailwind classes for the main title of an item (e.g., job title, degree).", nullable: true },
        itemSubtitle: { type: Type.STRING, description: "Tailwind classes for the subtitle of an item (e.g., company, institution).", nullable: true },
        itemDate: { type: Type.STRING, description: "Tailwind classes for the date range of an item.", nullable: true },
        itemList: { type: Type.STRING, description: "Tailwind classes for the list of descriptions/bullet points.", nullable: true },
        listItem: { type: Type.STRING, description: "Tailwind classes for a single list item/bullet point.", nullable: true },
        skillsList: { type: Type.STRING, description: "Tailwind classes for the container of skills.", nullable: true },
        skillItem: { type: Type.STRING, description: "Tailwind classes for a single skill item.", nullable: true },
    },
};

const resumeDataSchema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Full name." },
                email: { type: Type.STRING, description: "Email address." },
                phone: { type: Type.STRING, description: "Phone number." },
                website: { type: Type.STRING, description: "Personal website or portfolio URL." },
                location: { type: Type.STRING, description: "City and state, e.g., 'San Francisco, CA'." },
                summary: { type: Type.STRING, description: "Professional summary or objective statement." },
            },
        },
        experience: {
            type: Type.ARRAY,
            description: "A list of professional work experiences. Each item should be a distinct job role.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier, e.g., 'exp1'." },
                    jobTitle: { type: Type.STRING },
                    company: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.ARRAY, description: "List of accomplishments or responsibilities as bullet points.", items: { type: Type.STRING } },
                },
            },
        },
        education: {
            type: Type.ARRAY,
            description: "Education history.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier, e.g., 'edu1'." },
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    location: { type: Type.STRING },
                    gradDate: { type: Type.STRING, description: "Graduation date." },
                },
            },
        },
        certifications: {
            type: Type.ARRAY,
            description: "Professional certifications.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier, e.g., 'cert1'." },
                    name: { type: Type.STRING, description: "The name of the certification." },
                },
            },
        },
        skills: {
            type: Type.ARRAY,
            description: "List of technical or professional skills.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier, e.g., 'skill1'." },
                    name: { type: Type.STRING, description: "The name of the skill." },
                    years: { type: Type.INTEGER, description: "Years of experience. This should be 0 as per instructions." },
                },
            },
        },
        projects: {
            type: Type.ARRAY,
            description: "Personal or professional projects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier, e.g., 'proj1'." },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    link: { type: Type.STRING, description: "URL to the project or repository." },
                },
            },
        },
        keyArchitecturalProjects: {
            type: Type.ARRAY,
            description: "A list of key architectural projects. This is separate from general projects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier, e.g., 'kap1'." },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    link: { type: Type.STRING, description: "URL to the project or portfolio page." },
                },
            },
        },
    },
};

// Helper function to ensure the resume data structure is complete and has default values.
const normalizeResumeData = (data: Partial<ResumeData>): ResumeData => {
    // This function prevents crashes if the AI ommits a field (e.g., an empty 'experience' array).
    return {
        personalInfo: data.personalInfo || { name: '', email: '', phone: '', website: '', location: '', summary: '' },
        experience: data.experience || [],
        education: data.education || [],
        certifications: data.certifications || [],
        skills: data.skills || [],
        projects: data.projects || [],
        keyArchitecturalProjects: data.keyArchitecturalProjects || [],
    };
};


export const parseResumeText = async (resumeText: string): Promise<ResumeData> => {
    let response: GenerateContentResponse | undefined;
    try {
        // Robust, concise mapping of many real-world section title variants (case-insensitive)
        const prompt = `Extract resume information into JSON using the provided schema. Standardize section headers to these targets:

- experience: Professional Experience, Work Experience, Employment History, Work History, Career History, Roles, Positions, Experience, PROFESSIONAL EXPERIENCE
- education: Education, Academic Background, Educational Background, Academic Qualifications, Qualifications, EDUCATION
- certifications: Certifications, Certification, Certificates, Licenses, Professional Certifications, Credentials, CERTIFICATIONS
- skills: Skills, Technical Skills, Core Competencies, Competencies, Tech Stack, Technologies, Tools, Programming Languages, SKILLS, Technical Summary
- projects: Projects, Selected Projects, Key Projects, Notable Projects, Portfolio, Case Studies, PROJECTS, SELECTED PROJECTS
- personalInfo.summary: Summary, Professional Summary, Profile, About, About Me, Overview, Objective, Career Objective, Highlights, SUMMARY

Rules:
1) Case-insensitive header matching; headers may be uppercase, include punctuation (e.g., ":"), or small variants (e.g., "Selected Projects").
2) Generate stable IDs (exp1, exp2, edu1, proj1, skill1...).
3) Skills.years: extract from text if present (e.g., "Python (5 years)", "React - 3 yrs", "JavaScript: 7 years"); default to 0 if not stated.
4) Use context (dates, company/institution names, degrees) to place content in correct section.
5) Ignore sections not in schema (e.g., Awards, Publications) unless their content clearly belongs to an existing section.
6) Return only valid JSON for the full schema. Use [] for missing arrays and "" for empty strings.

Resume:
${resumeText}`;
        // Direct API call for faster parsing (no retry)
        response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeDataSchema,
            },
        });
        
        // More robust cleanup of the AI's response to extract the JSON object.
        let jsonText = response.text.trim();
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
            console.error("AI response did not contain a valid JSON object.", { responseText: jsonText });
            throw new Error("The AI's response was malformed and did not contain valid data.");
        }
        
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        
        const parsedData = JSON.parse(jsonText) as Partial<ResumeData>;

        // Ensure all array fields exist even if empty by normalizing the data
        return normalizeResumeData(parsedData);

    } catch (error) {
        console.error("Error parsing resume with Gemini:", error);
        
        // Improved error handling to give more specific feedback.
        if (error instanceof SyntaxError) {
            console.error("The AI returned text that could not be parsed as JSON.");
            if (response?.text) {
                console.error("Received text from AI:", response.text);
            }
            throw new Error("Failed to parse the resume. The AI's response was not in a valid JSON format. This can sometimes happen with unique resume layouts.");
        }
        
        // Basic check for API-related errors.
        if (error && typeof error === 'object' && 'message' in error) {
            const message = String(error.message).toLowerCase();
            if (message.includes('api key')) {
                throw new Error("The request to the AI service failed due to an API key issue. Please contact support.");
            }
        }
        
        // Fallback for other errors
        throw new Error("Failed to extract data from the resume. The AI model could not understand the format. Please ensure your file is a text-based document (not an image) and try again.");
    }
};

export const improveResumeContent = async (resumeData: ResumeData, prompt: string): Promise<ResumeData> => {
    try {
        // Create a deep copy to ensure we're working with fresh data
        const currentData = JSON.parse(JSON.stringify(resumeData));
        
        // Count experience items for explicit targeting
        const expCount = currentData.experience?.length || 0;
        
        const fullPrompt = `You are an expert resume writer. Revise the resume JSON based on the user's request.

**SCOPE OF CHANGES - CRITICAL:**
Apply improvements ONLY to these two sections:
1. personalInfo.summary (Professional Summary)
2. experience[].description (Work Experience bullet points)

**DO NOT MODIFY:**
- Projects, keyArchitecturalProjects, education, skills, certifications
- Job titles, company names, dates, locations, names, emails, phone numbers
- Any IDs or structural elements

**WHAT TO IMPROVE:**

For personalInfo.summary:
- Strengthen opening statement
- Use powerful action verbs
- Highlight key achievements and expertise
- Make it concise and impactful
- Keep it professional and focused

For experience[].description arrays:
- Replace weak verbs (managed, worked on, helped) with strong verbs (led, architected, spearheaded, drove, optimized)
- Remove filler words (very, really, basically, essentially)
- Make passive voice active ("was responsible for" → "led")
- Add impact where appropriate
- Keep all bullet points (don't remove any)
- Maintain technical accuracy
- Preserve metrics and numbers

**EXAMPLES:**

Before: "Managed a team of developers"
After: "Led a cross-functional team of 5 developers"

Before: "Worked on improving system performance"
After: "Optimized system performance, reducing load time by 40%"

Before: "Was responsible for database design"
After: "Architected scalable database solutions"

**User Request:**
"${prompt}"

**Current Resume (JSON):**
${JSON.stringify(currentData, null, 2)}

**IMPORTANT:** Return the complete JSON. Only modify personalInfo.summary and experience[].description arrays. Keep everything else exactly as is.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeDataSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const newResumeData = JSON.parse(jsonText) as Partial<ResumeData>;
        
        // Enhanced safety check: ensure no data loss by comparing with original
        const safeData = normalizeResumeData(newResumeData);
        
        // Additional safety checks to prevent data loss
        const finalData: ResumeData = {
            personalInfo: {
                name: safeData.personalInfo.name || currentData.personalInfo.name,
                email: safeData.personalInfo.email || currentData.personalInfo.email,
                phone: safeData.personalInfo.phone || currentData.personalInfo.phone,
                website: safeData.personalInfo.website || currentData.personalInfo.website,
                location: safeData.personalInfo.location || currentData.personalInfo.location,
                summary: safeData.personalInfo.summary || currentData.personalInfo.summary,
            },
            experience: safeData.experience.length > 0 ? safeData.experience : currentData.experience,
            education: safeData.education.length > 0 ? safeData.education : currentData.education,
            certifications: safeData.certifications.length > 0 ? safeData.certifications : currentData.certifications,
            skills: safeData.skills.length > 0 ? safeData.skills : currentData.skills,
            projects: safeData.projects.length > 0 ? safeData.projects : currentData.projects,
            keyArchitecturalProjects: safeData.keyArchitecturalProjects.length > 0 ? safeData.keyArchitecturalProjects : currentData.keyArchitecturalProjects,
        };
        
        return finalData;

    } catch (error) {
        console.error("Error improving content with Gemini:", error);
        // Return original data if improvement fails to prevent data loss
        return resumeData;
    }
};


export const generateStyles = async (resumeData: ResumeData, currentStyles: CustomStyles, prompt: string): Promise<CustomStyles> => {
    try {
        const fullPrompt = `
You are an expert web designer who specializes in Tailwind CSS. Your task is to act as a style engine, modifying a JSON object of Tailwind CSS classes based on a user's natural language request.

**Core Task:**
Analyze the user's request and intelligently update the provided JSON object of styles. You must add, remove, or replace Tailwind classes to achieve the desired effect while preserving existing, unrelated styles.

**CRITICAL RULES:**
1.  **Return a Complete JSON Object**: You MUST return the complete, valid JSON object that conforms to the provided schema. It must include ALL original keys from the 'currentStyles' input. Do not omit any keys.
2.  **Preserve Existing Styles**: When modifying a style, do NOT delete existing classes unless they are directly contradicted by the user's request. For example, if the user asks to "make the name bigger", and the current style is "text-4xl font-bold", the new style should be "text-5xl font-bold". The 'font-bold' class was preserved.
3.  **Intelligent Class Replacement**: If the user requests a change that conflicts with an existing class (e.g., changing font size from 'text-4xl' to 'text-5xl', or color from 'text-gray-800' to 'text-blue-600'), you should replace the old class with the new one.
4.  **Valid Tailwind Only**: Only use valid Tailwind CSS classes. For fonts, use 'font-serif' or 'font-sans'. For colors, use standard Tailwind color utilities (e.g., 'text-blue-600', 'bg-indigo-100').
5.  **No Action on Ambiguity**: If the user's request is unclear, unrelated to styling, or cannot be reasonably translated into Tailwind classes, you MUST return the 'currentStyles' object completely unmodified.

**INPUTS:**

**1. User's Request:**
"${prompt}"

**2. Current Styles (JSON object):**
${JSON.stringify(currentStyles, null, 2)}

**EXAMPLE:**
-   **User Request**: "Make the section titles underlined and dark green."
-   **Current 'sectionTitle' Style**: "text-xl font-bold text-gray-800 border-b-2 border-gray-800 pb-1 mb-3"
-   **Correct Updated 'sectionTitle' Style**: "text-xl font-bold text-green-800 border-b-2 border-gray-800 pb-1 mb-3 underline"
-   **Explanation**: You added 'underline' and replaced 'text-gray-800' with 'text-green-800', while keeping all other classes.

Now, based on the user's request, provide the updated and complete JSON object.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: styleSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const newStyles = JSON.parse(jsonText) as CustomStyles;
        
        return { ...currentStyles, ...newStyles };

    } catch (error) {
        console.error("Error generating styles with Gemini:", error);
        throw new Error("Failed to generate styles. The AI could not process the request. Please try a different prompt.");
    }
};

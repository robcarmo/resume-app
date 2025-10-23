import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { ResumeData, CustomStyles } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        // Refined and simplified prompt for better consistency
        const prompt = `
You are an expert resume parser. Your task is to extract information from the provided resume text and structure it into a JSON object that strictly conforms to the provided schema.

**Key Instructions:**
1.  **Schema Adherence**: Strictly follow the provided JSON schema. Return ALL fields defined in the schema, using \`[]\` for empty arrays and \`""\` for empty strings.
2.  **ID Generation**: For all items in arrays (e.g., experience, education), generate a unique string ID (like "exp1", "edu1").
3.  **Skills**: The 'years' property for each skill MUST be \`0\`.
4.  **Intelligent Mapping**: Intelligently map common resume section headers (e.g., "Work History") to the correct schema fields (e.g., "experience").
5.  **Clean Output**: Your final output must be ONLY the raw JSON object, with no surrounding text, explanations, or markdown formatting.

**Raw Resume Text:**
---
${resumeText}
---
`;
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
        
        const fullPrompt = `
You are an expert resume writer and career coach. Your task is to revise the provided resume content in JSON format based on the user's request.

**Core Task:**
Analyze the user's request and intelligently update the provided JSON object of resume data. Your revisions should be professional and aimed at making the resume more effective.

**CRITICAL RULES - DATA PRESERVATION:**
1.  **NEVER REMOVE OR DELETE ANY EXISTING INFORMATION**: You must preserve ALL existing data including job titles, company names, dates, skills, education details, certifications, and project information.
2.  **NEVER LEAVE ANY SECTION EMPTY**: If a section had content before, it must have content after. Do not remove or empty any arrays or strings that previously contained data.
3.  **PRESERVE ALL IDs**: Do not change the 'id' fields for any items in arrays (experience, education, etc.).
4.  **MAINTAIN FACTUAL ACCURACY**: Keep all factual information (dates, company names, job titles, degree names, etc.) exactly as provided.
5.  **COMPLETE JSON OBJECT**: Return the complete, valid JSON object that conforms to the provided schema with ALL original keys and data structures.

**ENHANCEMENT GUIDELINES:**
- Only enhance, refine, and improve existing content
- Improve language clarity and professional tone
- Strengthen action verbs and impact statements
- Refine descriptions while maintaining all technical details
- Ensure consistent formatting
- If the request is unclear or cannot be reasonably addressed, return the data completely unmodified

**INPUTS:**

**1. User's Request:**
"${prompt}"

**2. Current Resume Data (JSON object):**
${JSON.stringify(currentData, null, 2)}

**EXAMPLE:**
-   **User Request**: "Rewrite my summary to be more impactful for a senior software engineer role."
-   **Action**: You would enhance the 'summary' string within the 'personalInfo' object while keeping all other data exactly the same, and return the entire, updated JSON object.

Now, based on the user's request, provide the updated and complete JSON object with ALL original data preserved and enhanced.
`;

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

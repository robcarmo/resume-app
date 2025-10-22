import { GoogleGenAI, Type } from "@google/genai";
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
    try {
        const prompt = `
You are an expert resume parser. Your task is to extract information from the following raw text from a resume and structure it into a JSON object that conforms to the provided schema. You must be very flexible with section titles, as they vary widely.

**Core Instructions:**
1.  **Strict Schema Adherence**: The final JSON object MUST strictly follow the provided schema. Do not add, remove, or rename any fields.
2.  **Comprehensive Parsing**: Parse all sections. Return all sections as defined in the schema, even if they are empty arrays (e.g., \`"projects": []\`).
3.  **Flexible Section Identification**: This is the most critical step. Resumes have varied formatting. Be flexible and look for common heading variations and aliases. A section's content continues until a new section header is found. For example, 'Work History' should be mapped to the 'experience' section.
4.  **No Fabricated Data**: If information for a field is not present in the text, use an empty string (\`""\`), an empty array (\`[]\`), or \`0\` for numbers. Do not invent information.
5.  **Unique IDs**: For all array items (experience, education, etc.), generate a unique string ID (e.g., "exp1", "edu1", "skill1").

**Detailed Section Parsing Rules & Aliases:**
-   **personalInfo**:
    -   **Source**: Usually at the top of the resume, sometimes without a clear header ("Contact Information").
    -   **Content**: Extract name, contact details (email, phone, website/LinkedIn), and location.
    -   **Summary**: Look for a paragraph under headers like "Summary", "Professional Summary", or "Objective". This paragraph should go into the \`summary\` field.

-   **experience**:
    -   **Headers**: "Professional Experience", "Work Experience", "Experience", "Professional History".
    -   **Content**: Identify each separate job. 'description' MUST be an array of strings. Each string should be a distinct bullet point describing a responsibility or accomplishment.
    -   **Technologies Sub-sections**: If a job entry has a "Technologies:", "Key Tech:", or similar subsection, extract all technologies from it. These technologies should be added to the main \`skills\` list, NOT to the job's \`description\` array.

-   **education**:
    -   **Headers**: "Education", "Academic Background".
    -   **Content**: Extract degree, institution, location, and graduation date.

-   **certifications**:
    -   **Headers**: "Certifications", "Professional Certifications", "Training", "Professional Development", "Recent Training", "Recent Specialization Training".
    -   **Content**: List any professional certifications or training programs found.

-   **skills**:
    -   **Headers**: "Skills", "Technical Skills", "Core Technical Competencies", "Core Technical Skills & Expertise", "Core Tech Stack & Skills", "Methodologies & Leadership", "Core Technical Competencies".
    -   **Content**: List technical skills like programming languages, frameworks, software, and tools. Also include methodologies like Agile or Scrum.
    -   **Flatten Sub-categories**: If skills are listed under sub-categories (e.g., "Cloud Platforms:", "Databases:"), collect all skills from all sub-categories and put them into the single \`skills\` array.
    -   **Source from Experience**: Also aggregate any technologies found in "Technologies:" subsections under each job in the "Professional Experience" section.
    -   **IMPORTANT**: The 'years' property for each skill MUST be \`0\`.
    -   **EXCLUDE**: Do not include soft skills. Explicitly ignore sections titled "Soft Skills" or "Soft Skills & Leadership". Do not extract items like "Communication", "Teamwork", or "Leadership".

-   **keyArchitecturalProjects**:
    -   **Headers**: "Key Architectural Projects", "Selected Projects", "Highlighted Projects", "Recently Completed Projects", "Selected Architectural Projects", "Key Projects", "Architectural Projects".
    -   **Content**: This section is for a curated list of important projects. If you find a section with one of these titles, map its content here. This is distinct from the general 'projects' section.

-   **projects**:
    -   **Headers**: "Projects", "Personal Projects".
    -   **Content**: Parse project name, description, and link from a general projects section. If both a "Key Architectural Projects" (or its aliases) and a "Projects" section exist, parse them into their respective fields.

**Final Check:**
-   Ignore sections that don't map to the schema, such as "Key Achievements & Impact" or "Core Competencies & Impact" if they are standalone sections and not part of a job description.
-   Ensure all fields from the schema are present in the final JSON, even if they are empty.

Raw Resume Text:
---
${resumeText}
---
        `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeDataSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as Partial<ResumeData>;

        // Ensure all array fields exist even if empty by normalizing the data
        return normalizeResumeData(parsedData);

    } catch (error) {
        console.error("Error parsing resume with Gemini:", error);
        throw new Error("Failed to extract data from resume. The AI model could not understand the format.");
    }
};

export const improveResumeContent = async (resumeData: ResumeData, prompt: string): Promise<ResumeData> => {
    try {
        const fullPrompt = `
You are an expert resume writer and career coach. Your task is to revise the provided resume content in JSON format based on the user's request.

**Core Task:**
Analyze the user's request and intelligently update the provided JSON object of resume data. Your revisions should be professional and aimed at making the resume more effective.

**CRITICAL RULES:**
1.  **Return a Complete JSON Object**: You MUST return the complete, valid JSON object that conforms to the provided schema. It must include ALL original keys and data structures. Do not omit any sections.
2.  **Targeted Revisions**: Only modify the parts of the resume mentioned in the user's request. For example, if asked to rewrite the summary, do not change the work experience.
3.  **Preserve IDs**: Do not change the 'id' fields for any items in arrays (experience, education, etc.).
4.  **No Structural Changes**: Do not add or remove keys from the JSON object. Adhere strictly to the provided schema.
5.  **No Action on Ambiguity**: If the user's request is unclear, unrelated to resume content, or cannot be reasonably addressed, you MUST return the 'resumeData' object completely unmodified.

**INPUTS:**

**1. User's Request:**
"${prompt}"

**2. Current Resume Data (JSON object):**
${JSON.stringify(resumeData, null, 2)}

**EXAMPLE:**
-   **User Request**: "Rewrite my summary to be more impactful for a senior software engineer role."
-   **Action**: You would rewrite the 'summary' string within the 'personalInfo' object and return the entire, updated JSON object.

Now, based on the user's request, provide the updated and complete JSON object.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: resumeDataSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const newResumeData = JSON.parse(jsonText) as Partial<ResumeData>;
        
        // Normalize the data to prevent errors if the AI returns an incomplete object
        return normalizeResumeData(newResumeData);

    } catch (error) {
        console.error("Error improving content with Gemini:", error);
        throw new Error("Failed to improve content. The AI could not process the request. Please try a different prompt.");
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
            model: "gemini-2.5-flash",
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
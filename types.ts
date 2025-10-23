
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  summary: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
  keyTech?: string;
}

export interface Education {
  id:string;
  degree: string;
  institution: string;
  location: string;
  gradDate: string;
}

export interface Certification {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
}

export interface Skill {
  id: string;
  name: string;
  years: number;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: Skill[];
  projects: Project[];
  keyArchitecturalProjects: Project[];
}

export interface CustomStyles {
  container?: string;
  header?: string;
  name?: string;
  contactInfo?: string;
  summary?: string;
  section?: string;
  sectionTitle?: string;
  itemHeader?: string;
  itemTitle?: string;
  itemSubtitle?: string;
  itemDate?: string;
  itemList?: string;
  listItem?: string;
  skillsList?: string;
  skillItem?: string;
}

export type Template = 'classic' | 'modern' | 'professional';
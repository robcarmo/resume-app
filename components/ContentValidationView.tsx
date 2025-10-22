import React from 'react';
import type { ResumeData } from '../types';

interface ContentValidationViewProps {
    resumeData: ResumeData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-700 border-b border-gray-300 pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

const Field: React.FC<{ label: string; value?: string | string[] }> = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    return (
        <div className="mb-3">
            <p className="text-sm font-semibold text-gray-600">{label}</p>
            {Array.isArray(value) ? (
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1 mt-1">
                    {value.map((item, index) => item && <li key={index}>{item}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
            )}
        </div>
    );
};


const ContentValidationView: React.FC<ContentValidationViewProps> = ({ resumeData }) => {
    const { personalInfo, experience, education, certifications, skills, projects, keyArchitecturalProjects } = resumeData;

    return (
        <div className="bg-white p-8 rounded-lg shadow-inner h-full">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Content Validation</h2>
                <p className="text-sm text-gray-500">Review the extracted text here. Edit the form on the left to make corrections.</p>
            </div>

            <Section title="Personal Information">
                <Field label="Name" value={personalInfo.name} />
                <Field label="Email" value={personalInfo.email} />
                <Field label="Phone" value={personalInfo.phone} />
                <Field label="Website" value={personalInfo.website} />
                <Field label="Location" value={personalInfo.location} />
                <Field label="Summary" value={personalInfo.summary} />
            </Section>

            {experience.length > 0 && (
                <Section title="Professional Experience">
                    {experience.map(exp => (
                        <div key={exp.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                            <p className="font-bold">{exp.jobTitle || 'Job Title'}</p>
                            <p className="text-sm italic">{exp.company} - {exp.location}</p>
                            <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</p>
                            <Field label="Description" value={exp.description} />
                        </div>
                    ))}
                </Section>
            )}

            {education.length > 0 && (
                <Section title="Education">
                    {education.map(edu => (
                        <div key={edu.id} className="mb-3 pb-3 border-b border-gray-200 last:border-b-0">
                             <p className="font-bold">{edu.degree || 'Degree'}</p>
                            <p className="text-sm italic">{edu.institution} - {edu.location}</p>
                            <p className="text-xs text-gray-500">{edu.gradDate}</p>
                        </div>
                    ))}
                </Section>
            )}
            
            {certifications.length > 0 && (
                 <Section title="Certifications">
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1 mt-1">
                        {certifications.map((c, i) => c.name && <li key={c.id}>{c.name}</li>)}
                    </ul>
                 </Section>
            )}

            {skills.length > 0 && (
                <Section title="Technical Skills">
                    <p className="text-sm text-gray-800">
                        {skills.map(skill => `${skill.name}${skill.years > 0 ? ` (${skill.years} yrs)` : ''}`).join(', ')}
                    </p>
                </Section>
            )}

            {projects.length > 0 && (
                 <Section title="Projects">
                    {projects.map(proj => (
                         <div key={proj.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                             <p className="font-bold">{proj.name || 'Project Name'}</p>
                             <p className="text-sm text-indigo-600">{proj.link}</p>
                             <p className="text-sm mt-1 whitespace-pre-wrap">{proj.description}</p>
                         </div>
                    ))}
                </Section>
            )}

            {keyArchitecturalProjects.length > 0 && (
                 <Section title="Key Architectural Projects">
                    {keyArchitecturalProjects.map(proj => (
                         <div key={proj.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                             <p className="font-bold">{proj.name || 'Project Name'}</p>
                             <p className="text-sm text-indigo-600">{proj.link}</p>
                             <p className="text-sm mt-1 whitespace-pre-wrap">{proj.description}</p>
                         </div>
                    ))}
                </Section>
            )}

        </div>
    );
};

export default ContentValidationView;

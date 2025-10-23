
import React from 'react';
import type { ResumeData, CustomStyles } from '../types';

interface ResumePreviewProps {
    resumeRef: React.RefObject<HTMLDivElement>;
    resumeData: ResumeData;
    styles: CustomStyles;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeRef, resumeData, styles }) => {
    const { personalInfo, experience, education, certifications, projects, skills, keyArchitecturalProjects } = resumeData;

    return (
        <div 
            ref={resumeRef} 
            className={`w-[210mm] min-h-[297mm] bg-white shadow-lg px-12 py-10 mx-auto text-gray-800 leading-normal ${styles.container || ''}`}
        >
            {/* Header */}
            <header className={`text-center pb-2 mb-4 ${styles.header || ''}`}>
                <h1 className={`text-3xl font-bold mb-2 ${styles.name || ''}`}>{personalInfo.name || 'Your Name'}</h1>
                <div className={`mt-2 text-xs flex justify-center flex-wrap items-center gap-x-2 gap-y-1 ${styles.contactInfo || ''}`}>
                    {personalInfo.email && (
                        <>
                            <span className="font-semibold">Email:</span>
                            <span className="text-blue-700">{personalInfo.email}</span>
                        </>
                    )}
                    {personalInfo.website && (
                        <>
                            <span>|</span>
                            <span className="font-semibold">LinkedIn:</span>
                            <span className="text-blue-700">{personalInfo.website}</span>
                        </>
                    )}
                    {personalInfo.location && (
                        <>
                            <span>|</span>
                            <span className="font-semibold">Location:</span>
                            <span>{personalInfo.location}</span>
                        </>
                    )}
                </div>
            </header>

            <main>
                {/* Summary */}
                {personalInfo.summary && (
                    <section className={`mb-6 ${styles.section || ''}`}>
                        <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>Professional Summary</h2>
                        <p className={`text-sm text-gray-700 leading-relaxed ${styles.summary || ''}`}>{personalInfo.summary}</p>
                    </section>
                )}

                {/* Education */}
                 {education.length > 0 && (
                    <section className={`mb-6 ${styles.section || ''}`}>
                        <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>Education</h2>
                        {education.map(edu => (
                            <div key={edu.id} className="mb-3">
                                <h3 className={`text-base font-bold ${styles.itemTitle || ''}`}>{edu.degree}</h3>
                                <p className={`text-sm ${styles.itemSubtitle || ''}`}>{edu.institution} | {edu.gradDate}</p>
                            </div>
                        ))}
                    </section>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                    <section className={`mb-6 ${styles.section || ''}`}>
                        <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>Certifications</h2>
                        <div className={`text-sm space-y-1 ${styles.itemList || ''}`}>
                            {certifications.map(cert => (
                                cert.name && <div key={cert.id} className={styles.listItem || ''}>{cert.name}</div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Experience */}
                {experience.length > 0 && (
                    <section className={`mb-6 ${styles.section || ''}`}>
                        <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>Professional Experience</h2>
                        {experience.map(exp => (
                            <div key={exp.id} className="mb-4">
                                <h3 className={`text-base font-bold ${styles.itemTitle || ''}`}>{exp.jobTitle}</h3>
                                <p className={`text-sm ${styles.itemSubtitle || ''}`}>
                                    {exp.company} | {exp.startDate} - {exp.endDate} | {exp.location}
                                </p>
                                <ul className={`mt-2 list-disc ml-5 text-sm space-y-1 ${styles.itemList || ''}`}>
                                    {exp.description.map((desc, i) => desc && <li key={i} className={`leading-normal ${styles.listItem || ''}`}>{desc}</li>)}
                                </ul>
                                {exp.keyTech && (
                                    <p className={`mt-2 text-xs text-gray-800 ${styles.listItem || ''}`}>
                                        <span className="font-semibold">Key Tech:</span> {exp.keyTech}
                                    </p>
                                )}
                            </div>
                        ))}
                    </section>
                )}
                
                {/* Skills */}
                {skills.length > 0 && (
                    <section className={`mb-6 ${styles.section || ''}`}>
                         <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>Technical Skills</h2>
                         <div className={`flex flex-wrap gap-x-4 gap-y-2 ${styles.skillsList || ''}`}>
                            {skills.map((skill) => skill.name && (
                                <div key={skill.id} className={`flex items-baseline ${styles.skillItem || ''}`}>
                                    <span className="font-semibold mr-1.5">{skill.name}</span>
                                    {skill.years > 0 && <span className="text-xs text-gray-600">({skill.years} {skill.years === 1 ? 'year' : 'years'})</span>}
                                </div>
                            ))}
                         </div>
                    </section>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                    <section className={`mb-6 ${styles.section || ''}`}>
                        <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>Projects</h2>
                        {projects.map(proj => (
                            <div key={proj.id} className="mb-3">
                                <div className={`flex justify-between items-baseline ${styles.itemHeader || ''}`}>
                                    <h3 className={`text-lg font-semibold ${styles.itemTitle || ''}`}>{proj.name}</h3>
                                    {proj.link && <a href={`//${proj.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{proj.link}</a>}
                                </div>
                                <p className={`mt-1 text-sm text-gray-700 ${styles.listItem || ''}`}>{proj.description}</p>
                            </div>
                        ))}
                    </section>
                )}

                {/* Key Architectural Projects */}
                {keyArchitecturalProjects.length > 0 && (
                    <section className={`${styles.section || ''}`}>
                        <h2 className={`text-xl font-semibold border-b-2 pb-1 mb-3 ${styles.sectionTitle || ''}`}>KEY ARCHITECTURAL PROJECTS</h2>
                        {keyArchitecturalProjects.map(proj => (
                            <div key={proj.id} className="mb-3">
                                <div className={`flex justify-between items-baseline ${styles.itemHeader || ''}`}>
                                    <h3 className={`text-lg font-semibold ${styles.itemTitle || ''}`}>{proj.name}</h3>
                                    {proj.link && <a href={`//${proj.link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{proj.link}</a>}
                                </div>
                                <p className={`mt-1 text-sm text-gray-700 ${styles.listItem || ''}`}>{proj.description}</p>
                            </div>
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
};

export default ResumePreview;
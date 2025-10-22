
import React from 'react';
import type { ResumeData, Experience, Education, Project, Skill, Certification } from '../types';

interface ResumeFormProps {
    resumeData: ResumeData;
    setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ resumeData, setResumeData }) => {
    // Handlers for personal info
    const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [name]: value } }));
    };

    // Generic handler for array items
    const handleArrayChange = <T extends { id: string }>(
        section: keyof ResumeData,
        index: number,
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        const list = resumeData[section] as T[];
        const updatedList = list.map((item, i) => (i === index ? { ...item, [name]: name === 'years' ? parseInt(value) || 0 : value } : item));
        setResumeData(prev => ({ ...prev, [section]: updatedList }));
    };

    const handleDescriptionChange = (index: number, descIndex: number, value: string) => {
        const updatedExperience = [...resumeData.experience];
        updatedExperience[index].description[descIndex] = value;
        setResumeData(prev => ({ ...prev, experience: updatedExperience }));
    };

    // Generic add/remove handlers
    const addArrayItem = <T,>(section: keyof ResumeData, newItem: T) => {
        const list = resumeData[section] as T[];
        setResumeData(prev => ({ ...prev, [section]: [...list, newItem] }));
    };

    const removeArrayItem = (section: keyof ResumeData, index: number) => {
        const list = resumeData[section] as any[];
        setResumeData(prev => ({ ...prev, [section]: list.filter((_, i) => i !== index) }));
    };

    const addDescriptionPoint = (expIndex: number) => {
        const updatedExperience = [...resumeData.experience];
        updatedExperience[expIndex].description.push('');
        setResumeData(prev => ({...prev, experience: updatedExperience}));
    };
    
    const removeDescriptionPoint = (expIndex: number, descIndex: number) => {
        const updatedExperience = [...resumeData.experience];
        updatedExperience[expIndex].description = updatedExperience[expIndex].description.filter((_, i) => i !== descIndex);
        setResumeData(prev => ({...prev, experience: updatedExperience}));
    };

    const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
    const labelClass = "block text-sm font-medium text-gray-700";
    const buttonClass = "px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
    const removeButtonClass = "px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500";

    return (
        <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
            {/* Personal Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
                <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" name="name" value={resumeData.personalInfo.name} onChange={handlePersonalInfoChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Phone</label>
                    <input type="tel" name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfoChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Website/Portfolio</label>
                    <input type="text" name="website" value={resumeData.personalInfo.website} onChange={handlePersonalInfoChange} className={inputClass} />
                </div>
                 <div>
                    <label className={labelClass}>Location</label>
                    <input type="text" name="location" value={resumeData.personalInfo.location} onChange={handlePersonalInfoChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Summary</label>
                    <textarea name="summary" value={resumeData.personalInfo.summary} onChange={handlePersonalInfoChange} rows={4} className={inputClass}></textarea>
                </div>
            </div>

            {/* Experience */}
            <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Professional Experience</h3>
                    <button onClick={() => addArrayItem<Experience>('experience', { id: Date.now().toString(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', description: [''] })} className={buttonClass}>Add</button>
                </div>
                <div className="space-y-4">
                    {resumeData.experience.map((exp, index) => (
                        <div key={exp.id} className="p-4 border rounded-md space-y-3">
                            <div className="flex justify-end">
                                <button onClick={() => removeArrayItem('experience', index)} className={removeButtonClass}>Remove</button>
                            </div>
                            <input type="text" name="jobTitle" placeholder="Job Title" value={exp.jobTitle} onChange={e => handleArrayChange('experience', index, e)} className={inputClass} />
                            <input type="text" name="company" placeholder="Company" value={exp.company} onChange={e => handleArrayChange('experience', index, e)} className={inputClass} />
                            <input type="text" name="location" placeholder="Location" value={exp.location} onChange={e => handleArrayChange('experience', index, e)} className={inputClass} />
                            <div className="flex space-x-2">
                                <input type="text" name="startDate" placeholder="Start Date" value={exp.startDate} onChange={e => handleArrayChange('experience', index, e)} className={inputClass} />
                                <input type="text" name="endDate" placeholder="End Date" value={exp.endDate} onChange={e => handleArrayChange('experience', index, e)} className={inputClass} />
                            </div>
                            <label className={labelClass}>Description</label>
                            {exp.description.map((desc, descIndex) => (
                                <div key={descIndex} className="flex items-center space-x-2">
                                    <textarea value={desc} onChange={e => handleDescriptionChange(index, descIndex, e.target.value)} rows={2} className={`${inputClass} w-full`}></textarea>
                                    <button onClick={() => removeDescriptionPoint(index, descIndex)} className={`${removeButtonClass} h-fit`}>-</button>
                                </div>
                            ))}
                            <button onClick={() => addDescriptionPoint(index)} className={`${buttonClass} mt-2`}>+ Add Point</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Education</h3>
                    <button onClick={() => addArrayItem<Education>('education', { id: Date.now().toString(), degree: '', institution: '', location: '', gradDate: '' })} className={buttonClass}>Add</button>
                </div>
                <div className="space-y-4">
                    {resumeData.education.map((edu, index) => (
                        <div key={edu.id} className="p-4 border rounded-md space-y-3">
                             <div className="flex justify-end">
                                <button onClick={() => removeArrayItem('education', index)} className={removeButtonClass}>Remove</button>
                            </div>
                            <input type="text" name="degree" placeholder="Degree" value={edu.degree} onChange={e => handleArrayChange('education', index, e)} className={inputClass} />
                            <input type="text" name="institution" placeholder="Institution" value={edu.institution} onChange={e => handleArrayChange('education', index, e)} className={inputClass} />
                            <input type="text" name="location" placeholder="Location" value={edu.location} onChange={e => handleArrayChange('education', index, e)} className={inputClass} />
                            <input type="text" name="gradDate" placeholder="Graduation Date" value={edu.gradDate} onChange={e => handleArrayChange('education', index, e)} className={inputClass} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Certifications */}
            <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Certifications</h3>
                    <button onClick={() => addArrayItem<Certification>('certifications', { id: Date.now().toString(), name: '' })} className={buttonClass}>Add</button>
                </div>
                <div className="space-y-4">
                    {resumeData.certifications.map((cert, index) => (
                        <div key={cert.id} className="p-4 border rounded-md space-y-3">
                            <div className="flex justify-end">
                                <button onClick={() => removeArrayItem('certifications', index)} className={removeButtonClass}>Remove</button>
                            </div>
                            <input type="text" name="name" placeholder="Certification Name" value={cert.name} onChange={e => handleArrayChange('certifications', index, e)} className={inputClass} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Technical Skills</h3>
                    <button onClick={() => addArrayItem<Skill>('skills', { id: Date.now().toString(), name: '', years: 0 })} className={buttonClass}>Add</button>
                </div>
                <div className="space-y-4">
                    {resumeData.skills.map((skill, index) => (
                        <div key={skill.id} className="p-4 border rounded-md space-y-3">
                             <div className="flex items-end space-x-2">
                                <div className="flex-grow">
                                    <label className={labelClass}>Skill Name</label>
                                    <input type="text" name="name" placeholder="e.g., React" value={skill.name} onChange={e => handleArrayChange('skills', index, e)} className={inputClass} />
                                </div>
                                <div className="w-1/3">
                                     <label className={labelClass}>Years</label>
                                    <input type="number" name="years" placeholder="e.g., 5" value={skill.years} onChange={e => handleArrayChange('skills', index, e)} className={inputClass} />
                                </div>
                                <button onClick={() => removeArrayItem('skills', index)} className={`${removeButtonClass} h-fit`}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Projects */}
            <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
                    <button onClick={() => addArrayItem<Project>('projects', { id: Date.now().toString(), name: '', description: '', link: '' })} className={buttonClass}>Add</button>
                </div>
                <div className="space-y-4">
                    {resumeData.projects.map((proj, index) => (
                        <div key={proj.id} className="p-4 border rounded-md space-y-3">
                             <div className="flex justify-end">
                                <button onClick={() => removeArrayItem('projects', index)} className={removeButtonClass}>Remove</button>
                            </div>
                            <input type="text" name="name" placeholder="Project Name" value={proj.name} onChange={e => handleArrayChange('projects', index, e)} className={inputClass} />
                            <input type="text" name="link" placeholder="Project Link" value={proj.link} onChange={e => handleArrayChange('projects', index, e)} className={inputClass} />
                            <textarea name="description" placeholder="Project Description" value={proj.description} onChange={e => handleArrayChange('projects', index, e)} rows={3} className={inputClass}></textarea>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Architectural Projects */}
            <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Key Architectural Projects</h3>
                    <button onClick={() => addArrayItem<Project>('keyArchitecturalProjects', { id: Date.now().toString(), name: '', description: '', link: '' })} className={buttonClass}>Add</button>
                </div>
                <div className="space-y-4">
                    {resumeData.keyArchitecturalProjects.map((proj, index) => (
                        <div key={proj.id} className="p-4 border rounded-md space-y-3">
                             <div className="flex justify-end">
                                <button onClick={() => removeArrayItem('keyArchitecturalProjects', index)} className={removeButtonClass}>Remove</button>
                            </div>
                            <input type="text" name="name" placeholder="Project Name" value={proj.name} onChange={e => handleArrayChange('keyArchitecturalProjects', index, e)} className={inputClass} />
                            <input type="text" name="link" placeholder="Project Link" value={proj.link} onChange={e => handleArrayChange('keyArchitecturalProjects', index, e)} className={inputClass} />
                            <textarea name="description" placeholder="Project Description" value={proj.description} onChange={e => handleArrayChange('keyArchitecturalProjects', index, e)} rows={3} className={inputClass}></textarea>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ResumeForm;
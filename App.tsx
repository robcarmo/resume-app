import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { ResumeData, CustomStyles, Template } from './types';
import { parseResumeText, improveResumeContent } from './services/geminiService';
import ResumePreview from './components/ResumePreview';
import TemplateSelector from './components/TemplateSelector';
import PdfUploader from './components/PdfUploader';
import { DownloadIcon, DocumentArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from './components/icons';
import OriginalResumeViewer from './components/OriginalResumeViewer';
import ContentImprover from './components/ContentImprover';

type WorkflowStep = 'upload' | 'improve' | 'format';

const professionalStyles: CustomStyles = {
    container: 'font-sans text-gray-900 leading-normal',
    header: 'border-b-2 border-blue-700 pb-2 mb-4',
    name: 'text-blue-700 font-bold text-3xl',
    contactInfo: 'text-xs text-gray-800',
    sectionTitle: 'text-base font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-3',
    itemTitle: 'text-sm font-bold text-gray-900',
    itemSubtitle: 'text-xs text-gray-700',
    itemDate: 'text-xs text-gray-700',
    summary: 'text-xs text-gray-800 leading-normal',
    listItem: 'text-xs text-gray-800 leading-normal',
    skillItem: 'text-xs text-gray-800',
    itemList: 'text-xs',
};

const classicStyles: CustomStyles = {
    container: 'font-serif',
    name: 'text-4xl font-bold text-gray-800',
    contactInfo: 'text-sm text-gray-600',
    sectionTitle: 'text-xl font-bold text-gray-800 border-b-2 border-gray-800 pb-1 mb-3',
    itemTitle: 'text-lg font-semibold',
    itemSubtitle: 'italic',
};

const modernStyles: CustomStyles = {
    container: 'font-sans',
    header: 'bg-gray-800 text-white p-6 -mx-10 -mt-10 mb-6',
    name: 'text-5xl font-light text-white tracking-wider',
    contactInfo: 'text-sm text-gray-300',
    sectionTitle: 'text-lg font-semibold text-indigo-600 uppercase tracking-wider border-b-2 border-indigo-200 pb-1 mb-4',
    itemTitle: 'text-lg font-bold text-gray-900',
    itemSubtitle: 'text-gray-600',
    skillItem: 'bg-indigo-100 text-indigo-800',
};

const initialStyles: Record<Template, CustomStyles> = {
    professional: professionalStyles,
    classic: classicStyles,
    modern: modernStyles,
};

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
    const [rawResumeData, setRawResumeData] = useState<any>(null);
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [template, setTemplate] = useState<Template>('professional');
    const [customStyles, setCustomStyles] = useState<CustomStyles>(initialStyles.professional);
    const [isParsing, setIsParsing] = useState(false);
    const [parseStartTime, setParseStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [parsingError, setParsingError] = useState<string | null>(null);
    const [originalResumeText, setOriginalResumeText] = useState<string | null>(null);
    const [isImproving, setIsImproving] = useState(false);
    const [improvingError, setImprovingError] = useState<string | null>(null);

    const resumeRef = useRef<HTMLDivElement>(null);
    
    // Update elapsed time every second during parsing
    useEffect(() => {
        if (!isParsing || !parseStartTime) {
            setElapsedSeconds(0);
            return;
        }
        
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - parseStartTime) / 1000));
        }, 1000);
        
        return () => clearInterval(interval);
    }, [isParsing, parseStartTime]);

    const handleSelectTemplate = useCallback((selectedTemplate: Template) => {
        setTemplate(selectedTemplate);
        setCustomStyles(initialStyles[selectedTemplate]);
    }, []);

    const handleProceedToFormat = () => {
        setCurrentStep('format');
    };

    const handleStartOver = () => {
        setCurrentStep('upload');
        setRawResumeData(null);
        setResumeData(null);
        setOriginalResumeText(null);
        setParsingError(null);
        setImprovingError(null);
    };

    const handleImproveContent = async (prompt: string) => {
        if (!resumeData) return;
        setIsImproving(true);
        setImprovingError(null);
        try {
            const newResumeData = await improveResumeContent(resumeData, prompt);
            setResumeData(newResumeData);
        } catch (err) {
            setImprovingError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsImproving(false);
        }
    };

    const handleDownloadPdf = async () => {
        const element = resumeRef.current;
        if (!element) return;
        
        const originalShadow = element.style.boxShadow;
        element.style.boxShadow = 'none';

        const canvas = await window.html2canvas(element, {
            scale: 2,
            useCORS: true,
        });

        element.style.boxShadow = originalShadow;
        
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate scaling to fit PDF width
        const ratio = pdfWidth / canvasWidth;
        const scaledHeight = canvasHeight * ratio;
        
        // Add first page
        let heightLeft = scaledHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
        
        // Add additional pages if content exceeds one page
        while (heightLeft > 0) {
            position = heightLeft - scaledHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save('resume.pdf');
    };
    
    const handleDownloadDocx = () => {
        if (!resumeData) return;
        
        const docx = (window as any).docx;
        if (!docx) {
            alert('Could not generate DOCX file. The "docx" library may not have loaded correctly. Please check your internet connection and try again.');
            console.error('docx library not found on window object.');
            return;
        }

        const { personalInfo, experience, education, certifications, skills, projects, keyArchitecturalProjects } = resumeData;

        // --- Template-specific styles ---
        const isModern = template === 'modern';
        const isProfessional = template === 'professional';
        const isClassic = template === 'classic';
        const font = isClassic ? 'Times New Roman' : 'Arial';
        const primaryColor = isProfessional ? '1D4ED8' : isModern ? '4F46E5' : '000000';

        const joinNonEmpty = (parts: (string | undefined | null)[], separator: string): string => {
            return parts.filter(p => p && p.trim()).join(separator);
        };

        const createSection = (title: string, children: (any | undefined)[]): any[] => {
            const validChildren = children.filter((c): c is any => !!c);
            if (validChildren.length === 0) return [];
            return [
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: title, bold: true, size: 28, color: (isModern || isProfessional) ? primaryColor : '000000' })],
                    spacing: { before: 400, after: 150 },
                    border: (isModern || isProfessional) ? { bottom: { color: primaryColor, space: 1, value: "single", size: 6 } } : { bottom: { color: "auto", space: 1, value: "single", size: 6 } },
                }),
                ...validChildren
            ];
        };

        const contactInfoString = joinNonEmpty([
            personalInfo.email,
            personalInfo.phone,
            personalInfo.website,
            personalInfo.location,
        ], ' | ');
        
        // --- Document Header ---
        let headerChildren: any[] = [];
        if (isModern) {
            headerChildren.push(new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                rows: [
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({
                                children: [
                                    new docx.Paragraph({
                                        children: [new docx.TextRun({ text: personalInfo.name || 'Your Name', bold: true, size: 48, color: 'FFFFFF' })],
                                        alignment: docx.AlignmentType.CENTER,
                                        spacing: { after: 100 },
                                    }),
                                    new docx.Paragraph({
                                        children: [new docx.TextRun({ text: contactInfoString, size: 20, color: 'FFFFFF' })],
                                        alignment: docx.AlignmentType.CENTER,
                                    }),
                                ],
                                shading: { fill: primaryColor },
                                borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } },
                                margins: { top: 200, bottom: 200 },
                            }),
                        ],
                    }),
                ],
            }));
        } else {
             headerChildren.push(
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: personalInfo.name || 'Your Name', bold: true, size: 48, color: isProfessional ? primaryColor : '000000' })],
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 100 },
                }),
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: contactInfoString, size: 20 })],
                    alignment: docx.AlignmentType.CENTER,
                    border: isProfessional ? { bottom: { color: primaryColor, space: 1, value: "single", size: 6 } } : {},
                    spacing: { after: 200 },
                })
             );
        }

        // --- Skills Section (Modern Layout) ---
        let skillsContent: any;
        const validSkills = skills.filter(s => s.name && s.name.trim());
        if (validSkills.length > 0) {
            if (isModern) {
                const skillsChunks = [];
                const chunkSize = 3;
                for (let i = 0; i < validSkills.length; i += chunkSize) {
                    skillsChunks.push(validSkills.slice(i, i + chunkSize));
                }

                skillsContent = new docx.Table({
                    width: { size: 95, type: docx.WidthType.PERCENTAGE },
                    columnWidths: [33, 33, 33],
                    rows: skillsChunks.map(chunk => new docx.TableRow({
                        children: chunk.map(skill => new docx.TableCell({
                            children: [new docx.Paragraph(
                                `${skill.name}${skill.years > 0 ? ` (${skill.years} ${skill.years === 1 ? 'yr' : 'yrs'})` : ''}`
                            )],
                            borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } },
                        })).concat(Array(chunkSize - chunk.length).fill(new docx.TableCell({ children: [new docx.Paragraph('')], borders: { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } } })))
                    })),
                });
            } else {
                skillsContent = new docx.Paragraph({
                    children: [new docx.TextRun({
                        text: validSkills
                            .map(skill => `${skill.name}${skill.years > 0 ? ` (${skill.years} ${skill.years === 1 ? 'year' : 'years'})` : ''}`)
                            .join(', '),
                    })],
                });
            }
        }


        const doc = new docx.Document({
            styles: {
                default: {
                    document: {
                        run: { font: font, size: 22 }, // 11pt
                    },
                },
                paragraphStyles: [
                    {
                        id: "Hyperlink",
                        name: "Hyperlink",
                        basedOn: "Normal",
                        run: {
                            color: "0000FF",
                            underline: { type: docx.UnderlineType.SINGLE },
                        },
                    },
                ],
            },
            sections: [{
                children: [
                    ...headerChildren,

                    ...(personalInfo.summary ? createSection('Summary', [
                        new docx.Paragraph({ children: [new docx.TextRun(personalInfo.summary)], spacing: { before: 100 }})
                    ]) : []),

                    ...createSection('Education',
                        education.flatMap((edu, i) => {
                            if (!edu.degree && !edu.institution) return [];
                            return [
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: edu.degree || 'Degree', bold: true, size: 24 })],
                                    spacing: { before: i === 0 ? 100 : 200 },
                                }),
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: joinNonEmpty([edu.institution, edu.location], ' - '), italics: true })],
                                    spacing: { after: 0, before: 0 },
                                }),
                                 new docx.Paragraph({
                                    children: [new docx.TextRun({ text: edu.gradDate || '', italics: true, color: "555555" })],
                                    spacing: { after: 0, before: 0 },
                                }),
                            ];
                        })
                    ),

                    ...createSection('Certifications',
                        certifications.filter(cert => cert.name && cert.name.trim()).map(cert => new docx.Paragraph({
                            children: [new docx.TextRun(cert.name)], bullet: { level: 0 }, indentation: { left: 720 },
                        }))
                    ),

                    ...createSection('Professional Experience',
                        experience.flatMap((exp, i) => {
                            if (!exp.jobTitle && !exp.company && exp.description.every(d => !d.trim())) return [];
                            const experienceElements = [
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: exp.jobTitle || 'Job Title', bold: true, size: 24 })],
                                    spacing: { before: i === 0 ? 100 : 200 },
                                }),
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: joinNonEmpty([exp.company, exp.location], ' - '), italics: true })],
                                    spacing: { after: 0, before: 0 },
                                }),
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: joinNonEmpty([exp.startDate, exp.endDate], ' - '), italics: true, color: "555555" })],
                                    spacing: { after: 60, before: 0 },
                                }),
                                ...exp.description.filter(desc => desc && desc.trim()).map(desc => new docx.Paragraph({
                                    children: [new docx.TextRun(desc)], bullet: { level: 0 }, indentation: { left: 720 }, spacing: { after: 40 },
                                })),
                            ];
                            
                            if (exp.keyTech && exp.keyTech.trim()) {
                                experienceElements.push(
                                    new docx.Paragraph({
                                        children: [
                                            new docx.TextRun({ text: 'Key Tech: ', bold: true }),
                                            new docx.TextRun({ text: exp.keyTech })
                                        ],
                                        spacing: { after: 100, before: 40 },
                                    })
                                );
                            }
                            
                            return experienceElements;
                        })
                    ),

                    ...createSection('Technical Skills', skillsContent ? [skillsContent] : []),

                    ...createSection('Projects',
                        projects.flatMap((proj, i) => {
                            if (!proj.name && !proj.description) return [];
                            const projectChildren: any[] = [
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: proj.name || 'Project Name', bold: true, size: 24 })],
                                    spacing: { before: i === 0 ? 100 : 200 },
                                }),
                            ];
                            if (proj.link && proj.link.trim()) {
                                projectChildren.push(new docx.Paragraph({
                                    children: [new docx.ExternalHyperlink({
                                        children: [new docx.TextRun({ text: proj.link, style: "Hyperlink" })],
                                        link: `https://${proj.link.replace(/^https?:\/\//, '')}`,
                                    })],
                                    spacing: { before: 0, after: 0},
                                }));
                            }
                            if (proj.description && proj.description.trim()) {
                                projectChildren.push(new docx.Paragraph({ 
                                    children: [new docx.TextRun(proj.description)], spacing: { before: 0, after: 0},
                                }));
                            }
                            return projectChildren;
                        })
                    ),

                    ...createSection('KEY ARCHITECTURAL PROJECTS',
                        keyArchitecturalProjects.flatMap((proj, i) => {
                            if (!proj.name && !proj.description) return [];
                            const projectChildren: any[] = [
                                new docx.Paragraph({
                                    children: [new docx.TextRun({ text: proj.name || 'Project Name', bold: true, size: 24 })],
                                    spacing: { before: i === 0 ? 100 : 200 },
                                }),
                            ];
                            if (proj.link && proj.link.trim()) {
                                projectChildren.push(new docx.Paragraph({
                                    children: [new docx.ExternalHyperlink({
                                        children: [new docx.TextRun({ text: proj.link, style: "Hyperlink" })],
                                        link: `https://${proj.link.replace(/^https?:\/\//, '')}`,
                                    })],
                                    spacing: { before: 0, after: 0},
                                }));
                            }
                            if (proj.description && proj.description.trim()) {
                                projectChildren.push(new docx.Paragraph({ 
                                    children: [new docx.TextRun(proj.description)], spacing: { before: 0, after: 0},
                                }));
                            }
                            return projectChildren;
                        })
                    ),
                ],
            }],
        });
    
        docx.Packer.toBlob(doc).then((blob: Blob) => {
            window.saveAs(blob, `resume-${template}.docx`);
        });
    };

    const handleResumeParse = async (text: string) => {
        setIsParsing(true);
        setParsingError(null);
        setOriginalResumeText(text);
        setParseStartTime(Date.now());
        try {
            const parsedData = await parseResumeText(text);
            setRawResumeData(parsedData);
            setResumeData(parsedData);
            // Automatically move to improve step after successful parsing
            setCurrentStep('improve');
        } catch (err) {
            setParsingError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
            setResumeData(null);
        } finally {
            setIsParsing(false);
            setParseStartTime(null);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 'upload' && resumeData) {
            setCurrentStep('improve');
        } else if (currentStep === 'improve') {
            setCurrentStep('format');
        }
    };

    const handlePrevStep = () => {
        if (currentStep === 'format') {
            setCurrentStep('improve');
        } else if (currentStep === 'improve') {
            setCurrentStep('upload');
        }
    };

    const isAnyLoading = useMemo(
        () => isParsing || isImproving,
        [isParsing, isImproving]
    );

    const getStepTitle = (step: WorkflowStep) => {
        switch (step) {
            case 'upload': return 'Upload & Parse Resume';
            case 'improve': return 'AI Content Improvement';
            case 'format': return 'Format & Download';
        }
    };

    const getStepNumber = (step: WorkflowStep) => {
        switch (step) {
            case 'upload': return 1;
            case 'improve': return 2;
            case 'format': return 3;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-screen-2xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">AI Resume Formatter</h1>
                        {currentStep === 'format' && resumeData && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleDownloadDocx}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                                    Download DOCX
                                </button>
                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                    Download PDF
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Step Indicator */}
                    <div className="mt-4 flex items-center justify-center">
                        <div className="flex items-center space-x-4">
                            {(['upload', 'improve', 'format'] as WorkflowStep[]).map((step, index) => (
                                <div key={step} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                        currentStep === step 
                                            ? 'bg-indigo-600 text-white' 
                                            : getStepNumber(step) < getStepNumber(currentStep)
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-300 text-gray-600'
                                    }`}>
                                        {getStepNumber(step)}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${
                                        currentStep === step ? 'text-indigo-600' : 'text-gray-500'
                                    }`}>
                                        {getStepTitle(step)}
                                    </span>
                                    {index < 2 && (
                                        <div className={`ml-4 w-8 h-0.5 ${
                                            getStepNumber(step) < getStepNumber(currentStep) ? 'bg-green-500' : 'bg-gray-300'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-2xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Step 1: Upload & Parse */}
                {currentStep === 'upload' && (
                    <div className="max-w-2xl mx-auto py-12 px-4">
                        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Step 1: Upload Your Resume</h2>
                            <p className="mt-2 text-gray-600">Start by uploading your resume. The AI will automatically parse it and extract all the information.</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {elapsedSeconds > 0 ? `Processing... ${elapsedSeconds}s` : 'Typically takes 3-8 seconds...'}
                            </p>
                            <div className="mt-6">
                                <PdfUploader onParse={handleResumeParse} isParsing={isParsing} />
                            </div>
                            {parsingError && <div className="p-4 mt-4 bg-red-100 text-red-700 rounded-md text-sm text-left">{parsingError}</div>}
                        </div>
                    </div>
                )}

                {/* Parsing Loading State */}
                {isParsing && (
                    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                        <div className="flex flex-col items-center justify-center text-center">
                            <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 text-lg font-semibold text-indigo-700">Parsing your resume with AI...</p>
                            <p className="text-sm text-gray-500">This might take a moment.</p>
                        </div>
                    </div>
                )}

                {/* Step 2: AI Content Improvement */}
                {currentStep === 'improve' && resumeData && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white p-8 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Step 2: AI Content Improvement</h2>
                            <p className="text-gray-600 mb-6">Use AI to enhance your resume content before formatting. The AI can improve language, strengthen action verbs, and make your experience more impactful.</p>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <ContentImprover onImprove={handleImproveContent} isLoading={isImproving} />
                                    {improvingError && <div className="p-4 bg-red-100 text-red-700 rounded-md text-sm">{improvingError}</div>}
                                    
                                    {/* Tips */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-blue-900 mb-2">💡 Improvement Tips:</h3>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            <li>• "Make all descriptions more concise and impactful"</li>
                                            <li>• "Strengthen action verbs throughout the resume"</li>
                                            <li>• "Improve the professional summary"</li>
                                            <li>• "Add more quantifiable achievements"</li>
                                        </ul>
                                    </div>

                                    {originalResumeText && <OriginalResumeViewer text={originalResumeText} />}
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-4">Preview</h3>
                                    <div className="max-h-96 overflow-y-auto">
                                        <ResumePreview resumeRef={resumeRef} resumeData={resumeData} styles={customStyles} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={handlePrevStep}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                    Back to Upload
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    disabled={isImproving}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                                >
                                    Continue to Formatting
                                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Format & Download */}
                {currentStep === 'format' && resumeData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="h-[calc(100vh-200px)] overflow-y-auto pr-4">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Step 3: Format & Download</h2>
                                    <p className="text-gray-600 mb-4">Choose a template and customize the formatting to create your final resume.</p>
                                </div>
                                
                                <TemplateSelector selectedTemplate={template} onSelectTemplate={handleSelectTemplate} />
                                
                                <div className="flex justify-between">
                                    <button
                                        onClick={handlePrevStep}
                                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                        Back to Improve
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="h-[calc(100vh-200px)] overflow-y-auto bg-gray-200 p-4 rounded-lg">
                            <ResumePreview resumeRef={resumeRef} resumeData={resumeData} styles={customStyles} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
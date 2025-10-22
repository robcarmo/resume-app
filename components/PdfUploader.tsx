import React, { useRef, useState, useCallback } from 'react';
import { UploadIcon, DocumentIcon } from './icons';

declare const mammoth: any;

interface PdfUploaderProps {
    onParse: (text: string) => Promise<void>;
    isParsing: boolean;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onParse, isParsing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileProcessing = useCallback(async (file: File) => {
        if (isParsing) return;
        
        setError(null);
        setFileName(file.name);

        try {
            const fileReader = new FileReader();
            const lowerCaseName = file.name.toLowerCase();

            if (lowerCaseName.endsWith('.pdf')) {
                fileReader.onload = async (e) => {
                    try {
                        if (!e.target?.result) throw new Error('Could not read file.');

                        const pdfjsLib = (window as any).pdfjsLib;
                        if (!pdfjsLib) {
                            throw new Error('PDF processing library failed to load. Please check your internet connection and refresh the page.');
                        }

                        const typedarray = new Uint8Array(e.target.result as ArrayBuffer);
                        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let fullText = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            if (textContent.items.length === 0) continue;
                            const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
                            fullText += pageText + '\n';
                        }
                        if (fullText.trim().length < 100) {
                            throw new Error('PDF appears to have very little text. Please upload a text-based resume.');
                        }
                        await onParse(fullText);
                    } catch (err) {
                         setError(err instanceof Error ? err.message : 'Failed to process PDF. It may be an image or corrupted.');
                         setFileName(null);
                    }
                };
                fileReader.readAsArrayBuffer(file);
            } else if (lowerCaseName.endsWith('.docx')) {
                fileReader.onload = async (e) => {
                    try {
                        if (!e.target?.result) throw new Error('Could not read file.');
                        const arrayBuffer = e.target.result as ArrayBuffer;
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        await onParse(result.value);
                    } catch (err) {
                        setError('Failed to process DOCX file. It might be corrupted or password-protected.');
                        setFileName(null);
                    }
                };
                fileReader.readAsArrayBuffer(file);
            } else if (lowerCaseName.endsWith('.txt')) {
                fileReader.onload = async (e) => {
                    try {
                       if (!e.target?.result) throw new Error('Could not read file.');
                       await onParse(e.target.result as string);
                    } catch(err) {
                        setError('Failed to read text file.');
                        setFileName(null);
                    }
                };
                fileReader.readAsText(file);
            } else {
                setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
                setFileName(null);
                return;
            }
            
            fileReader.onerror = () => {
                 setError('Failed to read the file.');
                 setFileName(null);
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setFileName(null);
        }
    }, [onParse, isParsing]);

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileProcessing(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const handleDragEvent = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isParsing) return;
        setIsDragging(isEntering);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvent(e, false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileProcessing(file);
        }
    };

    const handleClick = () => {
        if (!isParsing) {
            fileInputRef.current?.click();
        }
    };

    const dropzoneBaseClasses = "relative block w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ease-in-out";
    const dropzoneIdleClasses = "border-gray-300 hover:border-indigo-400 cursor-pointer";
    const dropzoneDraggingClasses = "border-indigo-500 bg-indigo-50";
    const dropzoneDisabledClasses = "cursor-not-allowed bg-gray-100 border-gray-300";

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Import Resume</h3>
            <p className="text-sm text-gray-500 mb-3">Upload a PDF, DOCX, or TXT file to automatically fill the form.</p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                style={{ display: 'none' }}
                disabled={isParsing}
            />

            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={(e) => handleDragEvent(e, true)}
                onDragEnter={(e) => handleDragEvent(e, true)}
                onDragLeave={(e) => handleDragEvent(e, false)}
                className={`${dropzoneBaseClasses} ${isParsing ? dropzoneDisabledClasses : isDragging ? dropzoneDraggingClasses : dropzoneIdleClasses}`}
                aria-disabled={isParsing}
            >
                {isParsing ? (
                     <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-sm font-semibold text-indigo-700">Parsing with AI...</p>
                        {fileName && (
                             <div className="mt-2 flex items-center text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
                                <DocumentIcon className="w-4 h-4 mr-1"/>
                                <span>{fileName}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOCX, or TXT</p>
                    </div>
                )}
            </div>
             {error && !isParsing && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
    );
};

export default PdfUploader;
import React from 'react';
import { DocumentIcon } from './icons';

interface OriginalResumeViewerProps {
    text: string;
}

const OriginalResumeViewer: React.FC<OriginalResumeViewerProps> = ({ text }) => {
    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <details>
                <summary className="text-lg font-semibold text-gray-800 cursor-pointer flex items-center justify-between list-none -m-4 p-4 hover:bg-gray-50 rounded-lg group">
                    <div className="flex items-center">
                        <DocumentIcon className="w-5 h-5 mr-2 text-indigo-500" />
                        View Original Uploaded Resume
                    </div>
                    {/* Simple chevron for open/close state */}
                    <svg className="w-5 h-5 text-gray-500 transform transition-transform duration-200 group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </summary>
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{text}</pre>
                </div>
            </details>
            <style>{`
                details > summary::-webkit-details-marker { display: none; }
            `}</style>
        </div>
    );
};

export default OriginalResumeViewer;

import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface ContentImproverProps {
    onImprove: (prompt: string) => void;
    isLoading: boolean;
}

const ContentImprover: React.FC<ContentImproverProps> = ({ onImprove, isLoading }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isLoading) {
            onImprove(prompt);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />
                Improve Content with AI
            </h3>
            <p className="text-sm text-gray-500 mb-2">Describe the changes you want, or try these examples:</p>
            
            {/* Quick example prompts */}
            <div className="flex flex-wrap gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => setPrompt('Make all bullet points more concise without losing key information')}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
                >
                    Make Concise
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt('Improve action verbs in experience section')}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
                >
                    Better Verbs
                </button>
                <button
                    type="button"
                    onClick={() => setPrompt('Rewrite summary to be more impactful')}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition disabled:opacity-50"
                >
                    Improve Summary
                </button>
            </div>
            
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Shorten all descriptions while keeping key achievements and metrics"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                    rows={3}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-3 w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Improving...
                        </>
                    ) : (
                       'Apply Improvement'
                    )}
                </button>
            </form>
        </div>
    );
};

export default ContentImprover;
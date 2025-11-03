import React, { useState, useEffect } from 'react';
import { getAvailableProviders, getCurrentProvider, getCurrentModel, setCurrentProvider, type AIProvider } from '../services/geminiService';

interface AIProviderSettingsProps {
    onProviderChange?: () => void;
}

const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ onProviderChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<AIProvider>(getCurrentProvider());
    const [selectedModel, setSelectedModel] = useState<string>(getCurrentModel());
    const [availableProviders, setAvailableProviders] = useState(getAvailableProviders());

    useEffect(() => {
        const providers = getAvailableProviders();
        const provider = getCurrentProvider();
        const model = getCurrentModel();
        console.log('AIProviderSettings initialized:', { providers, provider, model });
        setAvailableProviders(providers);
        setSelectedProvider(provider);
        setSelectedModel(model);
    }, []);

    const handleProviderChange = (provider: AIProvider) => {
        const providerInfo = availableProviders.find(p => p.provider === provider);
        const defaultModel = providerInfo?.models?.[0] || '';
        
        setSelectedProvider(provider);
        setSelectedModel(defaultModel);
        setCurrentProvider(provider, defaultModel);
        
        if (onProviderChange) {
            onProviderChange();
        }
    };

    const handleModelChange = (model: string) => {
        console.log('Model changed to:', model, 'for provider:', selectedProvider);
        setSelectedModel(model);
        setCurrentProvider(selectedProvider, model);
        
        if (onProviderChange) {
            onProviderChange();
        }
    };

    const currentProviderInfo = availableProviders.find(p => p.provider === selectedProvider);
    const availableModels = currentProviderInfo?.models || [];
    
    console.log('Current render state:', {
        selectedProvider,
        selectedModel,
        currentProviderInfo,
        availableModels
    });

    const getProviderIcon = (provider: AIProvider) => {
        if (provider === 'ollama-local') return '🖥️';
        if (provider === 'ollama-cloud') return '☁️';
        if (provider === 'openai') return '🤖';
        if (provider === 'gemini') return '✨';
        return '🧠';
    };

    const getStatusColor = () => {
        if (selectedProvider.includes('ollama')) return 'bg-green-500';
        if (selectedProvider === 'openai') return 'bg-blue-500';
        if (selectedProvider === 'gemini') return 'bg-purple-500';
        return 'bg-gray-500';
    };

    return (
        <div className="relative">
            {/* Settings Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="AI Provider Settings"
            >
                <span className="mr-2">{getProviderIcon(selectedProvider)}</span>
                <span className="hidden sm:inline">{currentProviderInfo?.label || 'AI Settings'}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    
                    {/* Settings Panel */}
                    <div className="absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">⚙️ AI Provider</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Provider Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Provider
                            </label>
                            <select
                                value={selectedProvider}
                                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {availableProviders.map(({ provider, label }) => (
                                    <option key={provider} value={provider}>
                                        {getProviderIcon(provider)} {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Model Selector */}
                        {availableModels.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model
                                </label>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={availableModels.length === 1}
                                >
                                    {availableModels.map((model) => (
                                        <option key={model} value={model}>
                                            {model}
                                        </option>
                                    ))}
                                </select>
                                {availableModels.length === 1 && (
                                    <p className="mt-1 text-xs text-gray-500">Only one model available</p>
                                )}
                            </div>
                        )}

                        {/* Status Indicator */}
                        <div className="flex items-center p-3 bg-gray-50 rounded-md">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`} />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                    {currentProviderInfo?.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Model: {selectedModel}
                                </div>
                            </div>
                        </div>

                        {/* Info Text */}
                        <div className="mt-3 text-xs text-gray-500">
                            {selectedProvider.includes('ollama') && (
                                <p>🛡️ Free, private, {selectedProvider === 'ollama-local' ? 'offline' : 'cloud'} processing</p>
                            )}
                            {selectedProvider === 'openai' && (
                                <p>💳 Paid API - Best quality</p>
                            )}
                            {selectedProvider === 'gemini' && (
                                <p>✨ Google AI - Free tier available</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIProviderSettings;
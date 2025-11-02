
import React, { useMemo } from 'react';
import type { Template } from '../types';

interface TemplateSelectorProps {
    selectedTemplate: Template;
    onSelectTemplate: (template: Template) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = React.memo(({ selectedTemplate, onSelectTemplate }) => {
    // Memoize templates array to prevent re-creation on every render
    const templates = useMemo<{ id: Template; name: string }[]>(() => [
        { id: 'professional', name: 'Professional' },
        { id: 'classic', name: 'Classic' },
        { id: 'modern', name: 'Modern' },
    ], []);

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Select a Template</h3>
            <div className="flex space-x-2">
                {templates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => onSelectTemplate(template.id)}
                        className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                            ${selectedTemplate === template.id
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {template.name}
                    </button>
                ))}
            </div>
        </div>
    );
});

TemplateSelector.displayName = 'TemplateSelector';

export default TemplateSelector;


import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Very basic markdown processing for a clean look without external heavy libs
  const lines = content.split('\n');
  
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      {lines.map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold text-amber-400 mt-6 mb-2 border-b border-amber-900/50 pb-1">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-cinzel font-bold text-amber-300 mt-8 mb-4 border-b border-amber-800 pb-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-cinzel font-bold text-amber-200 text-center my-8 uppercase tracking-widest">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-2 items-start ml-4">
              <span className="text-amber-500 mt-1.5">•</span>
              <span>{line.substring(2)}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={index} className="h-2" />;
        
        // Handle bolding **text**
        const boldedLine = line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-amber-100 font-semibold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        return <p key={index}>{boldedLine}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;

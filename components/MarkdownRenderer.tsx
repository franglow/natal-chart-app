
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-8 text-gray-200 leading-relaxed max-w-none">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Clean up title (H1)
        if (trimmedLine.startsWith('# ')) {
          return (
            <div key={index} className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-cinzel font-bold text-amber-200 uppercase tracking-[0.25em] drop-shadow-[0_0_15px_rgba(251,191,36,0.4)] mb-4">
                {trimmedLine.replace('# ', '')}
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50"></div>
                <span className="text-amber-500/80 text-lg">✦</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50"></div>
              </div>
            </div>
          );
        }

        // Section headers (H2)
        if (trimmedLine.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl md:text-2xl font-cinzel font-bold text-amber-300 mt-12 mb-6 border-b border-amber-900/30 pb-3 tracking-[0.15em] flex items-center gap-3">
              <span className="text-amber-500 text-sm">❂</span>
              {trimmedLine.replace('## ', '')}
            </h2>
          );
        }

        // Subheaders (H3)
        if (trimmedLine.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-bold text-amber-400 mt-8 mb-4 italic tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              {trimmedLine.replace('### ', '')}
            </h3>
          );
        }

        // List items
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const itemText = trimmedLine.substring(2);
          return (
            <div key={index} className="flex gap-4 items-start ml-2 md:ml-8 group">
              <span className="text-amber-500/50 mt-1.5 transition-colors group-hover:text-amber-400 text-xs">✦</span>
              <span className="flex-1 text-amber-50/90">{parseInlineStyles(itemText)}</span>
            </div>
          );
        }

        if (trimmedLine === '') return <div key={index} className="h-2" />;

        // Paragraph
        return (
          <p key={index} className="text-amber-50/80 font-light text-base md:text-lg leading-[1.8] tracking-wide">
            {parseInlineStyles(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
};

function parseInlineStyles(text: string) {
  // Handle bolding **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return (
        <strong key={i} className="text-amber-200 font-semibold tracking-wide bg-amber-900/10 px-1 rounded">
          {content}
        </strong>
      );
    }
    return part;
  });
}

export default MarkdownRenderer;

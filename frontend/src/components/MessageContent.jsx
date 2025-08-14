import React from 'react';

const MessageContent = ({ content, isAI = false }) => {
  if (!isAI) {
    return (
      <div className="prose prose-sm max-w-none text-inherit">
        <p className="mb-0 whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  // Format AI responses with better structure
  const formatAIContent = (text) => {
    // Split by paragraphs and format
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      // Handle bold headers (text wrapped in **)
      if (trimmedParagraph.includes('**')) {
        const parts = trimmedParagraph.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={index} className="mb-4">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <h4 key={partIndex} className="font-bold text-base mb-2 text-primary">
                    {part.slice(2, -2)}
                  </h4>
                );
              }
              return part && (
                <p key={partIndex} className="mb-2 leading-relaxed whitespace-pre-wrap">
                  {formatInlineText(part)}
                </p>
              );
            })}
          </div>
        );
      }
      
      // Handle bullet points
      if (trimmedParagraph.includes('*') && trimmedParagraph.split('\n').some(line => line.trim().startsWith('*'))) {
        const lines = trimmedParagraph.split('\n');
        const listItems = [];
        let currentItem = '';
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('*')) {
            if (currentItem) {
              listItems.push(currentItem);
            }
            currentItem = trimmedLine.substring(1).trim();
          } else if (currentItem && trimmedLine) {
            currentItem += ' ' + trimmedLine;
          }
        });
        
        if (currentItem) {
          listItems.push(currentItem);
        }
        
        return (
          <div key={index} className="mb-4">
            <ul className="list-disc pl-5 space-y-2">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">
                  {formatInlineText(item)}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-3 leading-relaxed whitespace-pre-wrap">
          {formatInlineText(trimmedParagraph)}
        </p>
      );
    });
  };

  // Format inline text (bold, italic, etc.)
  const formatInlineText = (text) => {
    // Handle bold text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="prose prose-sm max-w-none text-inherit">
      <div className="space-y-2">
        {formatAIContent(content)}
      </div>
    </div>
  );
};

export default MessageContent;

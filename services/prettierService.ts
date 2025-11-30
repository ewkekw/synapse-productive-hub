import { Block } from '../types';

const REPLACEMENTS: [RegExp, string][] = [
  [/\s{2,}/g, ' '],
  [/\s+([,!?;:])(?!\d)/g, '$1'],
  [/([,!?;:])(?=[a-zA-Z])/g, '$1 '],
  [/\( \s*/g, '('],
  [/\s* \)/g, ')'],
  [/->/g, '→'],
  [/<-/g, '←'],
  [/!=/g, '≠'],
  [/>=/g, '≥'],
  [/<=/g, '≤'],
  [/\.\.\./g, '…'],
  [/\bi\b/g, 'I'],
  [/"\s*([^"]*?)\s*"/g, '“$1”'],
];

export const cleanText = (text: string): string => {
  let cleaned = text.trim();
  
  if (!cleaned) return '';

  REPLACEMENTS.forEach(([rule, replacement]) => {
    cleaned = cleaned.replace(rule, replacement);
  });

  if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
};

export const formatBlocks = (blocks: Block[]): Block[] => {
  const newBlocks: Block[] = [];
  
  blocks.forEach((block, index) => {
    let content = cleanText(block.content);
    
    if (block.type === 'heading') {
        content = content.replace(/[.;]+$/, '');
        
        const prevBlock = newBlocks.length > 0 ? newBlocks[newBlocks.length - 1] : null;
        if (prevBlock && prevBlock.type !== 'divider' && prevBlock.type !== 'heading') {
             if (prevBlock.content.trim() !== '') {
                 newBlocks.push({ id: `spacer-${Date.now()}-${index}`, type: 'paragraph', content: '' });
             }
        }
    }
    
    if (block.type === 'list-item' || block.type === 'task') {
         if (content.length > 0 && /^[a-z]/.test(content)) {
            content = content.charAt(0).toUpperCase() + content.slice(1);
         }
    }

    const isEmpty = content.length === 0 && block.type === 'paragraph';
    const wasPrevEmpty = newBlocks.length > 0 && 
                         newBlocks[newBlocks.length - 1].type === 'paragraph' && 
                         newBlocks[newBlocks.length - 1].content.length === 0;

    if (isEmpty && wasPrevEmpty) {
      return;
    }

    if (block.type === 'task' && content.length === 0) {
        if (blocks.length === 1) {
             newBlocks.push({ ...block, type: 'paragraph', content });
             return;
        }
        return; 
    }

    newBlocks.push({
      ...block,
      content
    });
  });

  while (newBlocks.length > 1 && 
         newBlocks[newBlocks.length - 1].type === 'paragraph' && 
         newBlocks[newBlocks.length - 1].content === '') {
    newBlocks.pop();
  }

  if (newBlocks.length === 0) {
      newBlocks.push({ id: `b-${Date.now()}`, type: 'paragraph', content: '' });
  }

  return newBlocks;
};
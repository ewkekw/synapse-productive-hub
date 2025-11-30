import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tag, X, Plus, Sparkles, Hash, Loader2, Search } from 'lucide-react';
import { Note } from '../types';
import { generateNoteTags } from '../services/geminiService';

interface TagManagerProps {
  tags: string[];
  noteContent: string;
  allNotes: Note[];
  onUpdateTags: (tags: string[]) => void;
  onTagClick: (tag: string) => void;
  isZenMode: boolean;
}

export const TagManager: React.FC<TagManagerProps> = ({ 
  tags, 
  noteContent, 
  allNotes, 
  onUpdateTags, 
  onTagClick,
  isZenMode 
}) => {
  const [isInputActive, setIsInputActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const allTagsSet = new Set<string>();
    allNotes.forEach(n => n.tags.forEach(t => allTagsSet.add(t.toLowerCase())));
    
    tags.forEach(t => allTagsSet.delete(t.toLowerCase()));

    const search = inputValue.trim().toLowerCase();
    const matches = Array.from(allTagsSet).filter(t => t.includes(search));
    
    return matches.sort((a, b) => {
        if (a.startsWith(search) && !b.startsWith(search)) return -1;
        if (!a.startsWith(search) && b.startsWith(search)) return 1;
        return a.localeCompare(b);
    }).slice(0, 5); 
  }, [allNotes, tags, inputValue]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue]);

  useEffect(() => {
    if (isInputActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!inputValue) {
             setIsInputActive(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue]);

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    
    if (!tags.includes(cleanTag)) {
        onUpdateTags([...tags, cleanTag]);
    }
    
    setInputValue('');
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateTags(tags.filter(t => t !== tagToRemove));
  };

  const handleGenerateAI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!noteContent || noteContent.length < 10) return;
    
    setIsGenerating(true);
    const newTags = await generateNoteTags(noteContent);
    setIsGenerating(false);
    
    if (newTags.length > 0) {
      const merged = Array.from(new Set([...tags, ...newTags]));
      onUpdateTags(merged);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
        case 'Enter':
            e.preventDefault();
            if (suggestions.length > 0 && inputValue.length > 0) {
                addTag(suggestions[highlightedIndex]);
            } else if (inputValue) {
                addTag(inputValue);
            } else {
                setIsInputActive(false);
            }
            break;
        
        case 'Backspace':
            if (!inputValue && tags.length > 0) {
                removeTag(tags[tags.length - 1]);
            }
            break;
        
        case 'Escape':
            e.preventDefault();
            setIsInputActive(false);
            setInputValue('');
            break;
        
        case 'ArrowDown':
            e.preventDefault();
            if (suggestions.length > 0) {
                setHighlightedIndex(prev => (prev + 1) % suggestions.length);
            }
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            if (suggestions.length > 0) {
                setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            }
            break;

        case 'Tab':
            e.preventDefault();
            if (suggestions.length > 0) {
                 addTag(suggestions[highlightedIndex]);
            }
            break;
    }
  };

  if (isZenMode) return null;

  return (
    <div 
      ref={containerRef}
      className="flex flex-wrap items-center gap-2 mt-3 mb-1 min-h-[32px] animate-fade-in"
    >
      {tags.map((tag) => (
        <div
          key={tag}
          className="
            group relative flex items-center gap-1.5 px-3 py-1 rounded-full
            bg-zen-surface/30 border border-zen-border/30 hover:border-zen-accent/40 hover:bg-zen-surface/80
            text-[11px] font-mono text-zen-muted hover:text-zen-heading
            transition-all duration-300 ease-out cursor-pointer
          "
          onClick={() => onTagClick(tag)}
          title={`Search for #${tag}`}
        >
          <span className="opacity-50 group-hover:opacity-100 transition-opacity">#</span>
          <span>{tag}</span>
          
          <button
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            className="
                w-0 overflow-hidden group-hover:w-4 opacity-0 group-hover:opacity-100 
                flex items-center justify-center transition-all duration-300
                text-zen-muted hover:text-red-400
            "
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ))}

      <div className="relative">
        {isInputActive ? (
          <div className="flex items-center">
            <div className={`
                flex items-center gap-2 px-3 py-1 rounded-md 
                bg-zen-bg border transition-all duration-300
                ${inputValue ? 'border-zen-accent/50 shadow-glow' : 'border-zen-border/50'}
            `}>
               <Hash size={10} className={inputValue ? 'text-zen-accent' : 'text-zen-muted'} />
               <input
                 ref={inputRef}
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 className="w-24 bg-transparent text-[11px] font-mono text-zen-heading placeholder-zen-muted/30 focus:outline-none"
                 placeholder="tag..."
               />
               <button onClick={() => setIsInputActive(false)} className="text-zen-muted hover:text-zen-heading">
                   <X size={10} />
               </button>
            </div>

            {suggestions.length > 0 && (
                <div 
                    ref={dropdownRef}
                    className="
                        absolute top-full left-0 mt-2 w-48 
                        bg-zen-surface/95 backdrop-blur-xl border border-zen-border/50 rounded-lg shadow-glass 
                        z-50 overflow-hidden flex flex-col py-1 animate-scale-in origin-top-left
                    "
                >
                    <div className="px-3 py-1.5 text-[9px] text-zen-muted uppercase tracking-wider border-b border-zen-border/20 mb-1 opacity-60">
                        Suggestions
                    </div>
                    {suggestions.map((s, idx) => (
                        <button
                            key={s}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => addTag(s)}
                            className={`
                                flex items-center justify-between px-3 py-1.5 text-left text-xs font-mono transition-colors w-full
                                ${idx === highlightedIndex ? 'bg-zen-accent/10 text-zen-accent' : 'text-zen-body hover:bg-zen-bg'}
                            `}
                        >
                            <span>#{s}</span>
                            {idx === highlightedIndex && <span className="text-[9px] opacity-50">↵</span>}
                        </button>
                    ))}
                </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 group/add">
            <button
                onClick={() => setIsInputActive(true)}
                className="
                    flex items-center gap-1.5 px-3 py-1 rounded-full
                    bg-transparent border border-dashed border-zen-border/40 hover:border-zen-accent/40 hover:bg-zen-surface/30
                    text-[11px] font-mono text-zen-muted hover:text-zen-heading
                    transition-all duration-300
                "
            >
                <Plus size={10} />
                <span>Add Tag</span>
            </button>

            <button
                onClick={handleGenerateAI}
                disabled={isGenerating || noteContent.length < 10}
                className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-full ml-1
                    transition-all duration-500
                    ${isGenerating 
                        ? 'bg-zen-accent/10 text-zen-accent cursor-wait' 
                        : 'text-zen-muted/50 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer'}
                    disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed
                `}
                title="AI Suggest Tags"
            >
                {isGenerating ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : (
                    <Sparkles size={12} strokeWidth={1.5} />
                )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
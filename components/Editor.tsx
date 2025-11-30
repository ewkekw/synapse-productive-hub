import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Note, Block } from '../types';
import { Type, Image as ImageIcon, GitFork, Quote, List, CheckSquare, Minus, GripVertical, AlignLeft, Link2, ArrowRight, Ghost, CornerDownRight, Download, Sparkles, Undo, Redo, Feather, Clock, FileText, Flower2, Save, Loader2 } from 'lucide-react';
import { TagManager } from './TagManager';
import { formatBlocks, cleanText } from '../services/prettierService';

interface EditorProps {
  note: Note;
  allNotes: Note[];
  unlinkedMentions: Note[];
  onUpdateNote: (note: Note) => void;
  onCreateNote: (note: Note) => void;
  onNavigate: (noteId: string) => void;
  onSearchTag: (tag: string) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
}

const SLASH_COMMANDS = [
  { type: 'heading', label: 'Heading', icon: Type, desc: 'Big section title', aliases: ['h1', 'header', 'title', '#'] },
  { type: 'paragraph', label: 'Text', icon: AlignLeft, desc: 'Plain text', aliases: ['p', 'plain', 'text'] },
  { type: 'list-item', label: 'List', icon: List, desc: 'Bullet point', aliases: ['ul', 'bullet', 'list', '-'] },
  { type: 'task', label: 'To-do', icon: CheckSquare, desc: 'Checklist item', aliases: ['todo', 'check', 'checkbox', '[]'] },
  { type: 'blockquote', label: 'Quote', icon: Quote, desc: 'Capture a quote', aliases: ['citation', 'quote', '>'] },
  { type: 'divider', label: 'Divider', icon: Minus, desc: 'Visual separation', aliases: ['line', 'hr', 'separator', '---'] },
  { type: 'reference', label: 'Link Note', icon: Link2, desc: 'Connect ideas', aliases: ['wiki', 'connect', 'link', '[['] },
];

const SlashMenu = ({ 
  position, 
  items,
  selectedIndex,
  onSelect, 
}: { 
  position: { top: number, left: number } | null, 
  items: typeof SLASH_COMMANDS,
  selectedIndex: number,
  onSelect: (type: Block['type']) => void, 
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (items.length === 0) return;
    
    const activeElement = itemRefs.current[selectedIndex];
    if (activeElement && listRef.current) {
      const menuRect = listRef.current.getBoundingClientRect();
      const itemRect = activeElement.getBoundingClientRect();

      if (itemRect.bottom > menuRect.bottom) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (itemRect.top < menuRect.top) {
         activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, items]);

  if (!position) return null;

  return (
    <div 
      className="fixed z-50 w-64 bg-zen-surface/95 backdrop-blur-2xl border border-zen-border/50 rounded-xl shadow-glass overflow-hidden animate-scale-in origin-top-left flex flex-col p-1.5"
      style={{ top: position.top + 32, left: position.left }}
    >
      <div className="px-3 py-2 text-[10px] font-mono text-zen-muted uppercase tracking-wider border-b border-zen-border/20 mb-1 opacity-70 flex justify-between">
        <span>Insert Block</span>
        <span className="text-[9px] border border-zen-border/30 px-1 rounded">↵ Select</span>
      </div>
      
      <div ref={listRef} className="max-h-60 overflow-y-auto scrollbar-hide">
        {items.length === 0 ? (
           <div className="px-3 py-2 text-sm text-zen-muted italic">No matching commands</div>
        ) : (
          items.map((opt, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={opt.type}
                ref={el => { itemRefs.current[idx] = el; }}
                onClick={() => onSelect(opt.type as Block['type'])}
                className={`
                  flex items-center gap-3 px-3 py-2.5 text-left rounded-lg group transition-all duration-100 ease-out w-full
                  ${isSelected ? 'bg-zen-accent/10' : 'hover:bg-zen-heading/5'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-300 shrink-0
                  ${isSelected 
                    ? 'border-zen-accent/40 bg-zen-bg text-zen-accent' 
                    : 'border-zen-border/30 text-zen-muted group-hover:text-zen-heading group-hover:border-zen-accent/20'}
                `}>
                  <opt.icon size={14} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-medium leading-none mb-1 transition-colors ${isSelected ? 'text-zen-heading' : 'text-zen-body'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-zen-muted leading-none opacity-70 truncate">{opt.desc}</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

const WikiMenu = ({ 
    position, 
    notes,
    onSelect, 
    onClose 
  }: { 
    position: { top: number, left: number } | null, 
    notes: Note[],
    onSelect: (noteId: string) => void, 
    onClose: () => void 
  }) => {
    if (!position) return null;
  
    return (
      <div 
        className="fixed z-50 w-72 bg-zen-surface/90 backdrop-blur-2xl border border-zen-border/50 rounded-xl shadow-glass overflow-hidden animate-scale-in origin-top-left flex flex-col p-1.5"
        style={{ top: position.top + 32, left: position.left }}
      >
        <div className="px-3 py-2 text-[10px] font-mono text-zen-muted uppercase tracking-wider border-b border-zen-border/20 mb-1 opacity-70 flex justify-between">
           <span>Connect Thought</span>
           <span className="text-[9px] border border-zen-border/30 px-1 rounded">ESC</span>
        </div>
        <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {notes.map((n, idx) => (
            <button
                key={n.id}
                onClick={() => onSelect(n.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zen-heading/5 rounded-lg group transition-all duration-200"
            >
                <div className="w-6 h-6 rounded border border-zen-border/30 flex items-center justify-center text-zen-accent/80 bg-zen-bg">
                   <GitFork size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zen-heading truncate">{n.title || "Untitled"}</div>
                  <div className="text-[10px] text-zen-muted truncate opacity-50">{n.id}</div>
                </div>
            </button>
            ))}
            {notes.length === 0 && (
                <div className="p-4 text-center text-xs text-zen-muted">No other notes found.</div>
            )}
        </div>
      </div>
    );
  };

export const Editor: React.FC<EditorProps> = ({ note, allNotes, unlinkedMentions, onUpdateNote, onCreateNote, onNavigate, onSearchTag, isZenMode, onToggleZenMode }) => {
  const [localNote, setLocalNote] = useState<Note>(note);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date>(new Date(note.updatedAt));
  
  const [refiningBlockId, setRefiningBlockId] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [justFormatted, setJustFormatted] = useState(false);
  
  const [history, setHistory] = useState<Note[]>([note]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number, left: number } | null>(null);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const [wikiMenuPos, setWikiMenuPos] = useState<{ top: number, left: number } | null>(null);
  const [wikiSearch, setWikiSearch] = useState('');
  
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement | HTMLInputElement | null }>({});
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const filteredCommands = useMemo(() => {
    if (!slashQuery) return SLASH_COMMANDS;
    const lowerQuery = slashQuery.toLowerCase();
    return SLASH_COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) || 
      cmd.aliases.some(alias => alias.includes(lowerQuery))
    );
  }, [slashQuery]);

  const smartStats = useMemo(() => {
    const blocks = localNote.blocks;
    let totalChars = 0;
    let totalWords = 0;
    let imageCount = 0;
    let hasComplexBlocks = false;

    for (const b of blocks) {
        if (b.type === 'image') {
            imageCount++;
            continue;
        }
        if (b.type === 'reference' || b.type === 'blockquote') {
            hasComplexBlocks = true;
        }
        if (!b.content) continue;

        const words = b.content.trim().split(/\s+/);
        if (words.length === 1 && words[0] === '') continue;
        
        totalWords += words.length;
        totalChars += b.content.length;
    }

    if (totalWords === 0 && imageCount === 0) {
        return { label: "Empty", detailedLabel: "Empty", difficulty: "Empty" };
    }

    const avgWordLength = totalWords > 0 ? totalChars / totalWords : 0;
    
    let wpm = 250;
    if (avgWordLength > 5) {
        const complexityFactor = (avgWordLength - 5) * 2; 
        wpm = Math.max(150, 250 - (complexityFactor * 30));
    }

    let seconds = (totalWords / wpm) * 60;
    
    if (imageCount > 0) {
        seconds += 12 + (Math.max(0, imageCount - 1) * 7);
    }

    const min = Math.floor(seconds / 60);
    
    let label = "";
    if (min < 1) label = "< 1m";
    else label = `${min} min`;

    let difficulty = "Light";
    if (avgWordLength > 6.2 || hasComplexBlocks) difficulty = "Dense";
    else if (avgWordLength > 5.5) difficulty = "Moderate";

    return {
        label,
        detailedLabel: `${label} read`,
        wordCount: totalWords,
        difficulty,
        wpm: Math.round(wpm)
    };
  }, [localNote.blocks]);

  useEffect(() => {
    if (note.id !== localNote.id) {
        setLocalNote(note);
        setHistory([note]);
        setHistoryIndex(0);
        closeMenus();
        setSaveStatus('saved');
    }
  }, [note.id]);

  // --- Auto Save Logic ---
  useEffect(() => {
    // If localNote differs from the last saved state (represented by note prop), schedule save
    // In a real app we'd compare content hash, here we rely on the fact that updates set 'unsaved'
    if (saveStatus === 'unsaved') {
        setSaveStatus('saving');
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            performSave();
        }, 2000); // 2 seconds auto-save debounce
    }

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [localNote, saveStatus]);

  // Ensure data is saved before leaving page
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (saveStatus !== 'saved') {
              performSave();
              e.preventDefault();
              e.returnValue = '';
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [localNote, saveStatus]);

  const performSave = useCallback(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      const noteToSave = { ...localNote, updatedAt: Date.now() };
      onUpdateNote(noteToSave);
      
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      setLocalNote(noteToSave); // Sync timestamps
  }, [localNote, onUpdateNote]);

  const handleManualSave = () => {
      setSaveStatus('saving');
      setTimeout(() => {
        performSave();
      }, 300); // Visual delay for feedback
  };

  const adjustHeight = useCallback((el: HTMLElement | null) => {
    if (el && 'style' in el && 'scrollHeight' in el) {
        el.style.height = 'auto'; 
        el.style.height = (el.scrollHeight + 4) + 'px'; 
    }
  }, []);

  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
            Object.values(blockRefs.current).forEach(adjustHeight);
        });
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [adjustHeight]);

  useEffect(() => {
     document.fonts.ready.then(() => {
        Object.values(blockRefs.current).forEach(adjustHeight);
     });
  }, [adjustHeight]);

  useLayoutEffect(() => {
     Object.values(blockRefs.current).forEach(adjustHeight);
  }, [localNote.blocks, adjustHeight]);

  const closeMenus = () => {
    setSlashMenuPos(null);
    setSlashMenuBlockId(null);
    setSlashQuery('');
    setSlashIndex(0);
    setWikiMenuPos(null);
  };

  const saveToHistory = useCallback((newNoteState: Note) => {
    const newHistory = history.slice(0, historyIndex + 1);
    // Simple deep compare to avoid duplicate history states
    if (JSON.stringify(newHistory[newHistory.length - 1].blocks) !== JSON.stringify(newNoteState.blocks) || newHistory[newHistory.length - 1].title !== newNoteState.title) {
        newHistory.push(newNoteState);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }
    setLocalNote(newNoteState);
    setSaveStatus('unsaved');
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        const prevNote = history[prevIndex];
        setHistoryIndex(prevIndex);
        setLocalNote(prevNote);
        setSaveStatus('unsaved');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        const nextNote = history[nextIndex];
        setHistoryIndex(nextIndex);
        setLocalNote(nextNote);
        setSaveStatus('unsaved');
    }
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const updatedBlocks = localNote.blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    );
    const updatedNote = { ...localNote, blocks: updatedBlocks };
    saveToHistory(updatedNote);
    
    requestAnimationFrame(() => {
        adjustHeight(blockRefs.current[blockId] as any);
    });
  };

  const addBlock = (type: Block['type'], afterId?: string, content: string = '') => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content
    };
    
    let newBlocks = [...localNote.blocks];
    if (afterId) {
      const index = newBlocks.findIndex(b => b.id === afterId);
      newBlocks.splice(index + 1, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }

    const updatedNote = { ...localNote, blocks: newBlocks };
    saveToHistory(updatedNote);
    
    setTimeout(() => {
      setActiveBlockId(newBlock.id);
      blockRefs.current[newBlock.id]?.focus();
    }, 0);
  };

  const deleteBlock = (blockId: string, focusPrev = true) => {
    const index = localNote.blocks.findIndex(b => b.id === blockId);
    if (localNote.blocks.length <= 1 && index === 0) {
        updateBlock(blockId, { content: '', type: 'paragraph' });
        return;
    }

    const newBlocks = localNote.blocks.filter(b => b.id !== blockId);
    const updatedNote = { ...localNote, blocks: newBlocks };
    saveToHistory(updatedNote);

    if (focusPrev && index > 0) {
      const prevId = localNote.blocks[index - 1].id;
      setActiveBlockId(prevId);
      setTimeout(() => {
        const el = blockRefs.current[prevId];
        if (el) {
          el.focus();
          const len = (el as any).value?.length || 0;
          if ('setSelectionRange' in el) {
             (el as any).setSelectionRange(len, len);
          }
        }
      }, 0);
    } else if (newBlocks.length > 0) {
        setActiveBlockId(newBlocks[0].id);
    }
  };

  const handleEnterKey = (e: React.KeyboardEvent, block: Block, index: number) => {
    e.preventDefault();

    if ((block.type === 'list-item' || block.type === 'task') && block.content.trim() === '') {
        updateBlock(block.id, { type: 'paragraph' });
        return;
    }

    const el = blockRefs.current[block.id] as any;
    if (!el) return;
    
    const cursor = el.selectionStart;
    const text = block.content;

    const textBefore = text.slice(0, cursor);
    const textAfter = text.slice(cursor);

    const updatedBlocks = [...localNote.blocks];
    updatedBlocks[index] = { ...block, content: textBefore };

    const nextType = (block.type === 'list-item' || block.type === 'task') ? block.type : 'paragraph';
    
    const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: nextType,
        content: textAfter,
        checked: false
    };

    updatedBlocks.splice(index + 1, 0, newBlock);

    const updatedNote = { ...localNote, blocks: updatedBlocks };
    saveToHistory(updatedNote);

    setTimeout(() => {
        setActiveBlockId(newBlock.id);
        const nextEl = blockRefs.current[newBlock.id] as any;
        if (nextEl) {
            nextEl.focus();
            nextEl.setSelectionRange(0, 0);
        }
    }, 0);
  };

  const handleBackspaceKey = (e: React.KeyboardEvent, block: Block, index: number) => {
    const el = blockRefs.current[block.id] as any;
    if (!el) return;

    if (el.selectionStart === 0 && el.selectionEnd === 0) {
        e.preventDefault();

        if (index === 0) return;

        const prevBlock = localNote.blocks[index - 1];
        const prevContentLength = prevBlock.content.length;

        if (prevBlock.type === 'divider' || prevBlock.type === 'image') {
             if (block.content === '') deleteBlock(block.id);
             return;
        }

        const newContent = prevBlock.content + block.content;
        
        const newBlocks = [...localNote.blocks];
        newBlocks.splice(index, 1);
        newBlocks[index - 1] = { ...prevBlock, content: newContent };

        const updatedNote = { ...localNote, blocks: newBlocks };
        saveToHistory(updatedNote);

        setTimeout(() => {
            setActiveBlockId(prevBlock.id);
            const prevEl = blockRefs.current[prevBlock.id] as any;
            if (prevEl) {
                prevEl.focus();
                prevEl.setSelectionRange(prevContentLength, prevContentLength);
                adjustHeight(prevEl);
            }
        }, 0);
    }
  };

  const handleImageUpload = (file: File, targetBlockId?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (targetBlockId) {
            const block = localNote.blocks.find(b => b.id === targetBlockId);
            if (block && block.content.trim() === '') {
                updateBlock(targetBlockId, { type: 'image', content: result });
            } else {
                addBlock('image', targetBlockId, result);
            }
        } else {
            addBlock('image', undefined, result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent, blockId: string) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleImageUpload(e.clipboardData.files[0], blockId);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
         handleImageUpload(file, activeBlockId || undefined);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (draggedBlockId === blockId) return;
    setDropTargetId(blockId);
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        setDropTargetId(null);
        return; 
    }
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null);
      setDropTargetId(null);
      return;
    }
    const fromIndex = localNote.blocks.findIndex(b => b.id === draggedBlockId);
    const toIndex = localNote.blocks.findIndex(b => b.id === targetBlockId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newBlocks = [...localNote.blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);

    const updatedNote = { ...localNote, blocks: newBlocks };
    saveToHistory(updatedNote);
    setDraggedBlockId(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDropTargetId(null);
  };

  const handleBranchBlock = (blockId: string) => {
    const blockToBranch = localNote.blocks.find(b => b.id === blockId);
    if (!blockToBranch || !blockToBranch.content.trim()) return;

    const newNoteId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newNoteId,
      title: blockToBranch.content.split(' ').slice(0, 5).join(' ') + '...',
      blocks: [
        { ...blockToBranch, id: `b-${Date.now()}` },
        { id: `b2-${Date.now()}`, type: 'paragraph', content: '' }
      ],
      tags: [],
      zettelType: 'permanent',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      connections: [localNote.id]
    };
    onCreateNote(newNote);

    updateBlock(blockId, { 
      type: 'reference', 
      content: newNote.title, 
      referenceId: newNoteId 
    });

    if (!localNote.connections.includes(newNoteId)) {
        const updatedConnections = [...localNote.connections, newNoteId];
        // Updating connections shouldn't trigger a full history push usually, but for simplicity:
        const updatedNote = { ...localNote, connections: updatedConnections };
        saveToHistory(updatedNote);
    }
  };

  const handleFormatDocument = () => {
    const formattedBlocks = formatBlocks(localNote.blocks);
    const updatedNote = { ...localNote, blocks: formattedBlocks };
    saveToHistory(updatedNote);
    setJustFormatted(true);
    setTimeout(() => setJustFormatted(false), 800);
    requestAnimationFrame(() => {
        Object.values(blockRefs.current).forEach(adjustHeight);
    });
  };

  const handleRefineBlock = (blockId: string) => {
    const block = localNote.blocks.find(b => b.id === blockId);
    if (!block) return;
    const formatted = cleanText(block.content);
    updateBlock(blockId, { content: formatted });
    setRefiningBlockId(blockId);
    setTimeout(() => setRefiningBlockId(null), 500); 
  };

  const handleSlashCommandSelect = (type: Block['type']) => {
    if (slashMenuBlockId) {
      updateBlock(slashMenuBlockId, { type, content: '' });
      closeMenus();
      setTimeout(() => blockRefs.current[slashMenuBlockId]?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block, index: number) => {
    if (slashMenuBlockId === block.id && slashMenuPos) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
            handleSlashCommandSelect(filteredCommands[slashIndex].type as Block['type']);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenus();
        return;
      }
    }

    if (wikiMenuPos) {
        if (e.key === 'Escape') {
            setWikiMenuPos(null);
            return;
        }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
    }

    if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key === 'f' || e.key === 'j')) {
        e.preventDefault();
        handleFormatDocument();
        return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
        return;
    }

    if (e.key === 'ArrowUp') {
      if (index > 0 && !slashMenuPos) {
        if (!e.shiftKey) { 
           if (slashMenuBlockId) closeMenus();
           
           const prevId = localNote.blocks[index - 1].id;
           setActiveBlockId(prevId);
           blockRefs.current[prevId]?.focus();
        }
      }
    }
    if (e.key === 'ArrowDown') {
      if (index < localNote.blocks.length - 1 && !slashMenuPos) {
         if (!e.shiftKey) {
            if (slashMenuBlockId) closeMenus();

            const nextId = localNote.blocks[index + 1].id;
            setActiveBlockId(nextId);
            blockRefs.current[nextId]?.focus();
         }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (!slashMenuPos && !wikiMenuPos) {
        handleEnterKey(e, block, index);
      }
    }

    if (e.key === 'Backspace') {
       handleBackspaceKey(e, block, index);
    }
  };

  const handleInput = (blockId: string, value: string) => {
    let type: Block['type'] | undefined;
    let cleanValue = value;

    if (value.startsWith('/')) {
        const query = value.substring(1);
        setSlashQuery(query);
        setSlashMenuBlockId(blockId);
        if (!slashMenuPos) setSlashIndex(0); 
        
        const el = blockRefs.current[blockId];
        if (el) {
            const rect = el.getBoundingClientRect();
            setSlashMenuPos({ top: rect.top, left: rect.left });
        }
    } else {
        if (slashMenuBlockId === blockId) {
            closeMenus();
        }
    }

    if (value === '# ') { type = 'heading'; cleanValue = ''; } 
    else if (value === '> ') { type = 'blockquote'; cleanValue = ''; } 
    else if (value === '- ' || value === '* ') { type = 'list-item'; cleanValue = ''; } 
    else if (value === '[] ') { type = 'task'; cleanValue = ''; } 
    else if (value === '---') { type = 'divider'; cleanValue = ''; }
    
    else if (value.startsWith('# ') && localNote.blocks.find(b=>b.id===blockId)?.type !== 'heading') { type = 'heading'; cleanValue = value.substring(2); }
    else if (value.startsWith('> ') && localNote.blocks.find(b=>b.id===blockId)?.type !== 'blockquote') { type = 'blockquote'; cleanValue = value.substring(2); }

    if (value.endsWith('[[')) {
        const el = blockRefs.current[blockId];
        if (el) {
            const rect = el.getBoundingClientRect();
            setWikiMenuPos({ top: rect.top, left: rect.left });
            setWikiSearch('');
        }
    } else if (wikiMenuPos) {
        const match = value.match(/\[\[([^\]]*)$/);
        if (match) {
            setWikiSearch(match[1]);
        } else {
            setWikiMenuPos(null);
        }
    }

    if (type) {
      updateBlock(blockId, { type, content: cleanValue });
      closeMenus(); 
    } else {
      updateBlock(blockId, { content: value });
    }
  };

  const handleExportNote = () => {
    const header = `# ${localNote.title}\n\n`;
    const body = localNote.blocks.map(b => {
        switch(b.type) {
            case 'heading': return `## ${b.content}\n`;
            case 'list-item': return `- ${b.content}\n`;
            case 'task': return `- [${b.checked ? 'x' : ' '}] ${b.content}\n`;
            case 'blockquote': return `> ${b.content}\n`;
            case 'reference': return `[[${b.content}]]\n`;
            case 'divider': return `\n---\n`;
            case 'image': return `![Image](${b.content})\n`;
            default: return `${b.content}\n\n`;
        }
    }).join('');
    
    const blob = new Blob([header + body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${localNote.title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerClass = isZenMode 
    ? 'max-w-[70ch] py-48'  
    : 'max-w-[75ch] py-24 px-8';

  const textBaseClass = isZenMode
    ? 'text-[1.4rem] leading-[2.1]' 
    : 'text-[1.125rem] leading-[1.8]';

  const backlinks = allNotes.filter(n => 
    n.connections.includes(localNote.id) || 
    n.blocks.some(b => b.type === 'reference' && b.referenceId === localNote.id)
  );

  const filteredWikiNotes = allNotes.filter(n => 
    n.id !== localNote.id && 
    (n.title.toLowerCase().includes(wikiSearch.toLowerCase()) || n.id.includes(wikiSearch))
  );

  return (
    <>
    <div className="fixed top-6 right-6 z-[60]">
        <button 
            onClick={onToggleZenMode} 
            className={`
                group flex items-center justify-center p-3 rounded-full 
                transition-all duration-1000 ease-fluid backdrop-blur-md
                ${isZenMode 
                    ? 'bg-zen-surface/10 hover:bg-zen-surface/30 text-zen-muted hover:text-zen-heading shadow-none hover:shadow-glow' 
                    : 'bg-transparent hover:bg-zen-surface/50 text-zen-muted/50 hover:text-zen-heading'}
            `}
            title={isZenMode ? "Exit Focus" : "Enter Focus"}
        >
            <Flower2 
                size={24} 
                strokeWidth={1.25} 
                className={`transition-all duration-1000 ease-fluid ${isZenMode ? 'rotate-180 scale-110 text-zen-accent' : 'rotate-0 scale-100'}`} 
            />
        </button>
    </div>

    <div 
      className={`
        relative mx-auto min-h-screen
        transition-all duration-1000 ease-fluid
        ${containerClass}
      `}
      onClick={(e) => {
          if (e.target === e.currentTarget) closeMenus();
      }}
      onDrop={handleContainerDrop}
      onDragOver={(e) => e.preventDefault()}
      ref={editorContainerRef}
    >
      <header className={`
        group flex items-center justify-between mb-16 select-none h-10
        transition-all duration-1000 ease-fluid
        ${isZenMode ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
      `}>
         <div className="flex items-center gap-4 text-xs font-mono text-zen-muted/80 tracking-wide">
            <div className="flex items-center gap-2 group/status cursor-default" title={saveStatus === 'saving' ? "Saving changes..." : "All changes saved"}>
               <div className={`
                    w-1.5 h-1.5 rounded-full transition-all duration-500 
                    ${saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500/50'}
               `}></div>
               <span className="opacity-60 group-hover/status:opacity-100 transition-opacity">
                  {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
               </span>
            </div>
            
            <div className="w-px h-3 bg-zen-border/40"></div>
            <span className="opacity-60 group-hover/status:opacity-100 transition-opacity">
               {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {smartStats.wordCount > 0 && (
                <>
                <div className="w-px h-3 bg-zen-border/40"></div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5" title="Reading Time">
                        <Clock size={10} strokeWidth={2} className="opacity-50" />
                        {smartStats.label}
                    </span>
                    <span className="opacity-30">•</span>
                    <span className="flex items-center gap-1.5" title="Word Count">
                        <FileText size={10} strokeWidth={2} className="opacity-50" />
                        {smartStats.wordCount}
                    </span>
                </div>
                </>
            )}
         </div>

         <div className={`
             flex items-center gap-1 transition-all duration-500
             ${isZenMode ? 'opacity-0' : 'opacity-100'}
         `}>
             <button
                onClick={handleManualSave}
                className={`
                    relative p-1.5 rounded-md hover:bg-zen-surface hover:text-zen-heading transition-all mr-2
                    ${saveStatus === 'unsaved' ? 'text-amber-500 hover:text-amber-400' : 'text-zen-muted'}
                `}
                title="Save (Ctrl+S)"
             >
                 <Save 
                    size={14} 
                    strokeWidth={1.5} 
                    className={`transition-all duration-500 ease-fluid ${saveStatus === 'saving' ? 'opacity-0 scale-50 rotate-180' : 'opacity-100 scale-100 rotate-0'}`}
                 />
                 <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ease-fluid ${saveStatus === 'saving' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -rotate-90'}`}>
                    <Loader2 size={14} className="animate-spin text-zen-accent" />
                 </div>
             </button>

             <div className="flex items-center gap-0.5 border-r border-zen-border/20 pr-2 mr-2">
                <button 
                  onClick={handleUndo} 
                  disabled={historyIndex <= 0} 
                  className="p-1.5 rounded-md hover:bg-zen-surface hover:text-zen-heading text-zen-muted disabled:opacity-20 transition-all"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={14} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={historyIndex >= history.length - 1} 
                  className="p-1.5 rounded-md hover:bg-zen-surface hover:text-zen-heading text-zen-muted disabled:opacity-20 transition-all"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo size={14} strokeWidth={1.5} />
                </button>
             </div>

             <button 
                onClick={handleFormatDocument}
                className={`p-1.5 rounded-md hover:bg-zen-surface hover:text-zen-heading text-zen-muted transition-all ${justFormatted ? 'text-zen-accent rotate-180' : ''}`} 
                title="Format Text (Ctrl+Shift+F)"
            >
                <Feather size={14} strokeWidth={1.5} /> 
            </button>
            
            <button 
                onClick={handleExportNote} 
                className="p-1.5 rounded-md hover:bg-zen-surface hover:text-zen-heading text-zen-muted transition-all" 
                title="Export Markdown"
            >
                <Download size={14} strokeWidth={1.5} />
            </button>
         </div>
      </header>

      <div className={`mb-12 group transition-all duration-1000 ease-fluid ${isZenMode ? 'opacity-80 hover:opacity-100' : 'opacity-100'}`}>
        <input 
          type="text" 
          value={localNote.title}
          onChange={(e) => {
             const updated = { ...localNote, title: e.target.value };
             saveToHistory(updated);
          }}
          placeholder="Untitled Thought"
          className={`
            w-full bg-transparent 
            font-serif font-bold tracking-tight text-zen-heading 
            placeholder:text-zen-muted/10 placeholder:font-normal
            focus:outline-none 
            transition-all duration-1000 ease-fluid selection:bg-zen-accent/30
            py-2 px-0 rounded
            ${isZenMode ? 'text-5xl text-center' : 'text-5xl md:text-6xl text-left'}
          `}
        />
        
        <TagManager 
          tags={localNote.tags}
          noteContent={localNote.blocks.map(b => b.content).join(' ')}
          allNotes={allNotes}
          onUpdateTags={(newTags) => {
             const updated = { ...localNote, tags: newTags };
             saveToHistory(updated);
          }}
          onTagClick={onSearchTag}
          isZenMode={isZenMode}
        />
      </div>

      <div className="space-y-4 relative">
        {localNote.blocks.map((block, index) => {
           const isActive = activeBlockId === block.id;
           const isDragging = draggedBlockId === block.id;
           const isDropTarget = dropTargetId === block.id;
           const isRefining = refiningBlockId === block.id;
           
           const opacityClass = isZenMode 
              ? (isActive 
                  ? 'opacity-100 translate-x-0 blur-none' 
                  : 'opacity-20 hover:opacity-50 transition-all duration-1000 ease-fluid blur-[2px] grayscale-[0.5]') 
              : (isDragging ? 'opacity-30 scale-95' : 'opacity-100');
            
           const flashClass = justFormatted || isRefining ? 'animate-pulse bg-zen-accent/5 rounded-lg' : '';

           return (
            <div 
              key={block.id} 
              draggable={true}
              onDragStart={(e) => handleDragStart(e, block.id)}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDrop={(e) => handleDrop(e, block.id)}
              onDragEnd={handleDragEnd}
              className={`
                group relative transition-all duration-1000 ease-fluid
                animate-slide-down-fade
                ${opacityClass} 
                ${flashClass}
                ${isDropTarget ? 'before:content-[""] before:absolute before:-top-3 before:left-0 before:right-0 before:h-[1px] before:bg-zen-accent before:shadow-glow' : ''}
                ${!isZenMode && isActive ? 'pl-4 border-l-2 border-zen-accent/50' : (!isZenMode ? 'pl-4 border-l-2 border-transparent' : '')}
              `}
              onClick={() => setActiveBlockId(block.id)}
            >
              
              <div 
                className={`
                  absolute -left-16 top-1/2 -translate-y-1/2 h-8 w-14
                  flex items-center justify-end
                  ${isZenMode ? 'hidden' : 'flex'}
                  z-20
                `}
              >
                 <div 
                    className="
                        cursor-grab opacity-0 group-hover:opacity-100 text-zen-muted/30 hover:text-zen-heading transition-all duration-300 p-1.5 rounded-md hover:bg-zen-surface/30
                        peer
                    "
                    title="Drag to reorder"
                 >
                    <GripVertical size={14} />
                 </div>

                 <div className="
                    absolute right-full mr-1 
                    flex items-center p-1
                    bg-zen-surface/90 backdrop-blur-xl border border-zen-border/40 
                    rounded-full shadow-2xl shadow-black/20
                    opacity-0 peer-hover:opacity-100 hover:opacity-100
                    scale-90 peer-hover:scale-100 hover:scale-100
                    translate-x-4 peer-hover:translate-x-0 hover:translate-x-0
                    pointer-events-none peer-hover:pointer-events-auto hover:pointer-events-auto
                    transition-all duration-300 ease-out origin-right
                 ">
                    <button onClick={() => handleRefineBlock(block.id)} className="p-1.5 text-zen-muted hover:text-amber-400 hover:bg-amber-900/10 rounded-full transition-colors" title="Prettify Block"><Sparkles size={12} /></button>
                    <button onClick={() => handleBranchBlock(block.id)} className="p-1.5 text-zen-muted hover:text-zen-accent hover:bg-zen-bg rounded-full transition-colors" title="Branch Note"><GitFork size={12} /></button>
                    
                    <div className="w-[1px] h-3 bg-zen-border/40 mx-1"></div>
                    
                    <button onClick={() => deleteBlock(block.id)} className="p-1.5 text-zen-muted hover:text-red-400 hover:bg-red-900/10 rounded-full transition-colors" title="Delete"><Minus size={12} /></button>
                 </div>
              </div>

              {block.type === 'heading' && (
                <textarea
                  ref={el => { if(el) { blockRefs.current[block.id] = el; adjustHeight(el); } }}
                  className={`w-full bg-transparent font-serif font-semibold text-zen-heading focus:outline-none placeholder-zen-muted/20 resize-none overflow-hidden selection:bg-zen-accent/30 py-1 px-1 rounded leading-[1.4] transition-all duration-1000 ease-fluid ${isZenMode ? 'text-4xl mt-8 mb-4' : 'text-3xl mt-6 mb-3'}`}
                  placeholder="Heading"
                  rows={1}
                  value={block.content}
                  onChange={(e) => handleInput(block.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, block, index)}
                  onPaste={(e) => handlePaste(e, block.id)}
                />
              )}
              
              {block.type === 'paragraph' && (
                <textarea
                  ref={el => { if(el) { blockRefs.current[block.id] = el; adjustHeight(el); } }}
                  className={`
                    w-full bg-transparent focus:outline-none resize-none overflow-hidden placeholder-zen-muted/10 font-serif transition-all duration-1000 ease-fluid selection:bg-zen-accent/30 py-1 px-1 rounded 
                    ${textBaseClass}
                    ${isZenMode && isActive ? 'text-[#e7e5e4]' : 'text-zen-body'}
                    ${isZenMode && !isActive ? 'text-[#a8a29e]' : ''}
                  `}
                  placeholder={isZenMode ? "" : "Type '/' for commands..."}
                  rows={1}
                  value={block.content}
                  onChange={(e) => handleInput(block.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, block, index)}
                  onPaste={(e) => handlePaste(e, block.id)}
                />
              )}

              {block.type === 'blockquote' && (
                <div className="flex gap-6 my-6 pl-2">
                  <div className="w-0.5 bg-zen-accent/50 rounded-full h-auto"></div>
                  <textarea
                    ref={el => { if(el) { blockRefs.current[block.id] = el; adjustHeight(el); } }}
                    className={`w-full bg-transparent font-serif italic text-zen-heading/80 focus:text-zen-heading focus:outline-none resize-none overflow-hidden leading-relaxed selection:bg-zen-accent/30 py-1 px-1 rounded transition-all duration-1000 ease-fluid ${isZenMode ? 'text-2xl' : 'text-2xl'}`}
                    value={block.content}
                    onChange={(e) => handleInput(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, block, index)}
                    onPaste={(e) => handlePaste(e, block.id)}
                  />
                </div>
              )}

              {block.type === 'list-item' && (
                <div className="flex items-start gap-3 pl-2 my-1">
                  <div className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-zen-muted/60 shrink-0"></div>
                  <textarea
                    ref={el => { if(el) { blockRefs.current[block.id] = el; adjustHeight(el); } }}
                    className={`
                      w-full bg-transparent focus:outline-none resize-none overflow-hidden selection:bg-zen-accent/30 py-1 px-1 rounded transition-all duration-1000 ease-fluid
                      ${textBaseClass}
                      ${isZenMode && isActive ? 'text-[#e7e5e4]' : 'text-zen-body'}
                      ${isZenMode && !isActive ? 'text-[#a8a29e]' : ''}
                    `}
                    value={block.content}
                    onChange={(e) => handleInput(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, block, index)}
                    onPaste={(e) => handlePaste(e, block.id)}
                  />
                </div>
              )}

              {block.type === 'task' && (
                <div className="flex items-start gap-3 pl-1 my-1">
                  <button 
                    onClick={() => updateBlock(block.id, { checked: !block.checked })}
                    className={`mt-[0.4em] w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 ${block.checked ? 'bg-zen-accent border-zen-accent scale-90' : 'border-zen-muted/50 hover:border-zen-heading bg-transparent'}`}
                  >
                     {block.checked && <CheckSquare size={10} className="text-zen-bg" />}
                  </button>
                  <input
                    ref={el => { if(el) blockRefs.current[block.id] = el; }}
                    className={`
                        w-full bg-transparent focus:outline-none transition-all duration-1000 ease-fluid selection:bg-zen-accent/30 py-1 px-1 rounded 
                        ${textBaseClass} 
                        ${block.checked ? 'text-zen-muted/50 line-through decoration-zen-muted/30' : (isZenMode && isActive ? 'text-[#e7e5e4]' : 'text-zen-body')}
                        ${isZenMode && !isActive ? 'text-[#a8a29e]' : ''}
                    `}
                    value={block.content}
                    onChange={(e) => handleInput(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, block, index)}
                  />
                </div>
              )}

              {block.type === 'reference' && (
                <div 
                  className="
                    group/card my-6 mx-2 p-5 rounded-xl 
                    bg-zen-surface/30 hover:bg-zen-surface/60 backdrop-blur-sm
                    border border-zen-border/40 hover:border-zen-accent/30 
                    cursor-pointer transition-all duration-500 ease-spring
                    flex items-center justify-between shadow-sm hover:shadow-float hover:-translate-y-1
                  "
                  onClick={() => block.referenceId && onNavigate(block.referenceId)}
                >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-zen-bg border border-zen-border/50 flex items-center justify-center text-zen-accent shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                         <GitFork size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                         <div className="text-base font-serif font-medium text-zen-heading group-hover/card:text-zen-accent transition-colors">{block.content}</div>
                         <div className="text-xs text-zen-muted flex items-center gap-1"><Link2 size={10}/> Referenced Thought</div>
                      </div>
                   </div>
                   <div className="w-8 h-8 rounded-full border border-zen-border/50 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500 -translate-x-4 group-hover/card:translate-x-0">
                     <ArrowRight size={14} className="text-zen-heading" />
                   </div>
                </div>
              )}

               {block.type === 'divider' && (
                 <div className="py-8 flex items-center justify-center group cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => {
                   if (index < localNote.blocks.length - 1) setActiveBlockId(localNote.blocks[index+1].id);
                 }}>
                   <div className="w-16 h-[1px] bg-zen-border group-hover:w-32 transition-all duration-700 ease-zen"></div>
                 </div>
               )}
              
               {block.type === 'image' && (
                <div className="relative rounded-lg overflow-hidden border border-zen-border bg-zen-bg group-hover:border-zen-muted/50 transition-colors my-6 shadow-zen hover:shadow-glass hover:scale-[1.01] duration-500">
                   <div className="min-h-[200px] flex flex-col items-center justify-center text-zen-muted relative">
                      {block.content ? (
                        <img src={block.content} alt="Block" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-8">
                          <ImageIcon size={32} strokeWidth={1} className="opacity-40"/>
                          <span className="text-sm font-mono opacity-40 uppercase tracking-widest">Drop Image</span>
                        </div>
                      )}
                      <input 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        placeholder="Image URL"
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        onPaste={(e) => handlePaste(e, block.id)}
                      />
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-[10px] text-center text-zen-muted font-mono">Image Block</div>
                   </div>
                </div>
              )}
            </div>
           );
        })}
        
        <div 
          className="h-[40vh] -z-10 cursor-text opacity-0" 
          onClick={() => {
             if (localNote.blocks.length > 0) {
                const lastId = localNote.blocks[localNote.blocks.length - 1].id;
                setActiveBlockId(lastId);
                blockRefs.current[lastId]?.focus();
             } else {
               addBlock('paragraph');
             }
          }} 
        />
      </div>

      {!isZenMode && (
         <div className="mt-32 pt-12 border-t border-dashed border-zen-border/30 animate-fade-in pb-48">
            
            {backlinks.length > 0 && (
              <div className="mb-12">
                <h3 className="text-[10px] font-mono text-zen-muted uppercase tracking-widest mb-6 flex items-center gap-2 opacity-70">
                   <Link2 size={12} /> Connected Context
                </h3>
                <div className="grid grid-cols-1 gap-3">
                   {backlinks.map(linkNote => (
                      <div 
                        key={linkNote.id}
                        onClick={() => onNavigate(linkNote.id)}
                        className="group flex items-start gap-4 p-4 rounded-xl bg-zen-surface/20 border border-transparent hover:border-zen-border hover:bg-zen-surface/50 cursor-pointer transition-all duration-300"
                      >
                         <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zen-muted/50 group-hover:bg-zen-accent transition-colors"></div>
                         <div className="flex-1">
                             <div className="text-sm font-serif text-zen-body group-hover:text-zen-heading transition-colors mb-1">
                                {linkNote.title || "Untitled Thought"}
                             </div>
                             <div className="text-xs text-zen-muted line-clamp-1 opacity-60 font-mono">
                                {linkNote.id} • Last updated {new Date(linkNote.updatedAt).toLocaleDateString()}
                             </div>
                         </div>
                         <CornerDownRight size={14} className="text-zen-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                   ))}
                </div>
              </div>
            )}

            {unlinkedMentions.length > 0 && (
                <div className="opacity-60 hover:opacity-100 transition-opacity duration-500">
                    <h3 className="text-[10px] font-mono text-zen-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Ghost size={12} /> Latent Connections
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {unlinkedMentions.map(uNote => (
                            <button 
                                key={uNote.id}
                                onClick={() => onNavigate(uNote.id)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zen-border/50 bg-zen-surface/10 hover:bg-zen-surface hover:border-zen-accent/50 transition-all group hover:scale-105"
                            >
                                <span className="text-xs text-zen-body group-hover:text-zen-heading font-medium">
                                    {uNote.title}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zen-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>
      )}

      {slashMenuPos && slashMenuBlockId && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenus} />
          <SlashMenu 
            position={slashMenuPos} 
            items={filteredCommands}
            selectedIndex={slashIndex}
            onSelect={handleSlashCommandSelect}
          />
        </>
      )}

      {wikiMenuPos && activeBlockId && (
        <>
           <div className="fixed inset-0 z-40" onClick={() => setWikiMenuPos(null)} />
           <WikiMenu
              position={wikiMenuPos}
              notes={filteredWikiNotes}
              onClose={() => setWikiMenuPos(null)}
              onSelect={(targetNoteId) => {
                 const targetNote = allNotes.find(n => n.id === targetNoteId);
                 if (targetNote) {
                     updateBlock(activeBlockId, { type: 'reference', content: targetNote.title, referenceId: targetNote.id });
                     setWikiMenuPos(null);
                     if(!localNote.connections.includes(targetNoteId)) {
                        const updatedConnections = [...localNote.connections, targetNoteId];
                        // Also trigger update on connection change for robustness
                        const updatedNote = { ...localNote, connections: updatedConnections };
                        saveToHistory(updatedNote);
                        onUpdateNote(updatedNote); 
                     }
                 }
              }}
           />
        </>
      )}
    </div>
    </>
  );
};
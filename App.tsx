import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { GraphView } from './components/GraphView';
import { Agenda } from './components/Agenda';
import { Settings } from './components/Settings';
import { SearchPage } from './components/SearchPage';
import { Note, Task, AppView } from './types';
import { getNotes, saveNotes, getTasks, saveTasks } from './services/storageService';
import { DEFAULT_NOTE_ID } from './constants';
import { Search, FileText, CornerDownLeft, Layout, PlusCircle } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.SEARCH); // Default to Search/Home
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>(DEFAULT_NOTE_ID);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedNotes = getNotes();
    const loadedTasks = getTasks();
    setNotes(loadedNotes);
    setTasks(loadedTasks);
    if (!loadedNotes.find(n => n.id === activeNoteId)) {
      if(loadedNotes.length > 0) setActiveNoteId(loadedNotes[0].id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveNotes(notes);
      saveTasks(tasks);
    }
  }, [notes, tasks, isLoaded]);

  // Design Requirement: Zen Mode is ONLY for the Editor.
  // If view changes away from EDITOR, force exit Zen Mode.
  useEffect(() => {
    if (view !== AppView.EDITOR && isZenMode) {
      setIsZenMode(false);
    }
    // Reset scroll position when view changes to prevent awkward jumps
    if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
    }
  }, [view, isZenMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
        setSearchQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setIsCmdOpen(false);
        if(isZenMode) setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode]);

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleCreateNote = (newNote: Note) => {
    setNotes(prev => [...prev, newNote]);
  };

  const handleNavigate = (noteId: string) => {
    setActiveNoteId(noteId);
    setView(AppView.EDITOR);
    setIsCmdOpen(false);
    setSearchQuery('');
  };

  const handleNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: '',
      blocks: [{ id: `b-${Date.now()}`, type: 'paragraph', content: '' }],
      tags: [],
      zettelType: 'fleeting',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      connections: []
    };
    handleCreateNote(newNote);
    setActiveNoteId(newNote.id);
    setView(AppView.EDITOR);
    setIsCmdOpen(false);
  };

  const handleSearchTag = (tag: string) => {
    setIsCmdOpen(true);
    setSearchQuery(tag);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  // Derive recent notes for Dashboard
  const recentNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  // Show pending tasks primarily
  const pendingTasks = tasks.filter(t => !t.completed); 

  const unlinkedMentions = activeNote && activeNote.title.length > 2 
    ? notes.filter(n => 
        n.id !== activeNote.id && 
        !n.connections.includes(activeNote.id) && 
        !activeNote.connections.includes(n.id) &&
        n.blocks.some(b => b.content.toLowerCase().includes(activeNote.title.toLowerCase()))
      )
    : [];

  const navResults = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.blocks.some(b => b.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const allActions = [
      { id: 'act-new', label: 'Create new thought', icon: PlusCircle, action: handleNewNote },
      { id: 'act-graph', label: 'Go to Graph', icon: Layout, action: () => { setView(AppView.GRAPH); setIsCmdOpen(false); } },
      { id: 'act-search', label: 'Search & Start', icon: Search, action: () => { setView(AppView.SEARCH); setIsCmdOpen(false); } },
  ];
  const filteredActions = searchQuery 
      ? allActions.filter(a => a.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : allActions;

  const combinedResults = [...filteredActions, ...navResults];

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % combinedResults.length);
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + combinedResults.length) % combinedResults.length);
      } else if (e.key === 'Enter') {
          e.preventDefault();
          const item = combinedResults[selectedIndex];
          if (item) {
              if ('action' in item) {
                  (item as any).action();
              } else {
                  handleNavigate((item as Note).id);
              }
          }
      }
  };


  return (
    <div className="flex h-screen w-full bg-zen-bg text-zen-body font-sans overflow-hidden selection:bg-zen-accent/20">
      
      <Sidebar 
        currentView={view} 
        onChangeView={setView} 
        onNewNote={handleNewNote}
        isZenMode={isZenMode}
      />

      <main 
        ref={mainScrollRef}
        className={`
            flex-1 relative h-full overflow-y-auto overflow-x-hidden scroll-smooth
            transition-all duration-[1200ms] ease-fluid
            ${isZenMode ? 'pl-0 bg-[#0a0a09]' : 'pl-20'}
        `}
      >
        {/* 
            VIEW CONTENT 
            Wrapped in a keyed div to force unmount/mount animations on view switch 
        */}
        <div key={view} className="h-full w-full animate-enter-slow">
            {view === AppView.SEARCH && (
            <SearchPage 
                recentNotes={recentNotes} 
                todaysTasks={pendingTasks} 
                notes={notes}
                onNavigateToNote={handleNavigate}
                onChangeView={setView}
                onToggleTask={handleToggleTask}
            />
            )}

            {view === AppView.EDITOR && activeNote && (
            <Editor 
                note={activeNote} 
                allNotes={notes}
                unlinkedMentions={unlinkedMentions}
                onUpdateNote={handleUpdateNote} 
                onCreateNote={handleCreateNote}
                onNavigate={handleNavigate}
                onSearchTag={handleSearchTag}
                isZenMode={isZenMode}
                onToggleZenMode={() => setIsZenMode(!isZenMode)}
            />
            )}

            {view === AppView.GRAPH && (
            <GraphView 
                notes={notes} 
                onSelectNote={handleNavigate} 
            />
            )}

            {view === AppView.AGENDA && (
            <Agenda 
                tasks={tasks} 
                onUpdateTasks={setTasks} 
            />
            )}

            {view === AppView.SETTINGS && (
            <Settings />
            )}
        </div>
      </main>

      {isCmdOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh] animate-enter-fast">
          <div className="w-full max-w-xl bg-zen-surface/90 backdrop-blur-2xl border border-zen-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-500 ease-fluid">
            
            <div className="flex items-center px-4 py-4 border-b border-zen-border/30">
              <Search className="text-zen-muted mr-3" size={20} strokeWidth={1.5} />
              <input 
                autoFocus
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Where to? (Type 'Graph' or search notes)..."
                className="flex-1 bg-transparent text-xl font-serif text-zen-heading placeholder-zen-muted/30 focus:outline-none"
              />
              <span className="text-xs font-mono text-zen-muted px-2 py-1 border border-zen-border/30 rounded bg-zen-bg/30">ESC</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              
              {filteredActions.length > 0 && (
                  <>
                    <div className="text-[10px] font-mono text-zen-muted uppercase px-3 py-2 opacity-50">Actions</div>
                    {filteredActions.map((action, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                            <button 
                                key={action.id}
                                onClick={action.action}
                                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 ease-fluid text-left group ${isSelected ? 'bg-zen-accent/10 translate-x-1' : 'hover:bg-zen-bg/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-zen-accent border-zen-accent text-white shadow-glow' : 'bg-zen-bg border-zen-border/50 text-zen-muted'}`}>
                                        <action.icon size={16} strokeWidth={1.5} />
                                    </div>
                                    <span className={`text-sm ${isSelected ? 'text-zen-accent font-medium' : 'text-zen-body'}`}>{action.label}</span>
                                </div>
                                {isSelected && <CornerDownLeft size={14} className="text-zen-accent animate-pulse" />}
                            </button>
                        )
                    })}
                  </>
              )}

              {navResults.length > 0 && (
                  <>
                     <div className="text-[10px] font-mono text-zen-muted uppercase px-3 py-2 mt-2 opacity-50">Thoughts</div>
                     {navResults.map((note, idx) => {
                        const actualIdx = idx + filteredActions.length;
                        const isSelected = actualIdx === selectedIndex;
                        return (
                            <button 
                                key={note.id}
                                onClick={() => handleNavigate(note.id)}
                                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 ease-fluid text-left group ${isSelected ? 'bg-zen-surface border border-zen-border/50 translate-x-1' : 'hover:bg-zen-bg/50 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 ${isSelected ? 'text-zen-heading' : 'text-zen-muted'}`}>
                                        <FileText size={16} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-serif truncate ${isSelected ? 'text-zen-heading' : 'text-zen-body'}`}>{note.title || "Untitled Note"}</div>
                                        <div className="text-xs text-zen-muted truncate opacity-70">
                                            {note.tags.length > 0 && <span className="mr-2 text-zen-accent font-mono">#{note.tags[0]}</span>}
                                            {note.blocks[0]?.content.substring(0, 50)}...
                                        </div>
                                    </div>
                                </div>
                                {isSelected && <CornerDownLeft size={14} className="text-zen-muted" />}
                            </button>
                        )
                     })}
                  </>
              )}

              {combinedResults.length === 0 && (
                <div className="px-4 py-12 text-center text-zen-muted text-sm italic opacity-50">
                  No neural pathways found.
                </div>
              )}
            </div>
            
            <div className="px-4 py-2 bg-zen-bg/40 border-t border-zen-border/30 text-[10px] text-zen-muted flex justify-between">
              <span className="flex items-center gap-2"><span className="font-mono bg-zen-border/20 px-1 rounded">↑↓</span> to navigate</span>
              <span className="flex items-center gap-2"><span className="font-mono bg-zen-border/20 px-1 rounded">↵</span> to select</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
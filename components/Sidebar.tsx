import React from 'react';
import { NotebookPen, Network, CalendarDays, Settings, Plus, Search } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewNote: () => void;
  isZenMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  onNewNote,
  isZenMode
}) => {
  
  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onChangeView(view)}
        className={`
          group relative flex items-center justify-center w-10 h-10 my-2 rounded-xl transition-all duration-500 ease-fluid
          ${isActive ? 'text-stone-200' : 'text-stone-600 hover:text-stone-400'}
        `}
        aria-label={label}
      >
        <div 
            className={`
                absolute inset-0 rounded-xl bg-amber-900/10 transition-all duration-[800ms] ease-fluid
                ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
            `}
        />
        
        <div className={`relative z-10 transition-all duration-500 ease-fluid ${isActive ? 'scale-100' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
           <Icon 
            size={20} 
            strokeWidth={1.25} 
            className={`transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_12px_rgba(217,119,6,0.3)] text-amber-600/90' : ''}`} 
          />
        </div>

        <div className="
            absolute left-full ml-4 px-3 py-1.5 
            bg-[#1c1917]/90 backdrop-blur-md border border-stone-800/50 
            text-[10px] font-medium tracking-widest uppercase text-stone-400 rounded-lg
            shadow-xl shadow-black/20
            opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0
            transition-all duration-500 ease-fluid delay-100
            pointer-events-none whitespace-nowrap z-50
        ">
          {label}
        </div>
      </button>
    );
  };

  return (
    <div 
      className={`
        fixed left-6 top-1/2 -translate-y-1/2 flex flex-col items-center py-6 px-1.5 z-50
        transition-all duration-[1200ms] ease-fluid
        ${isZenMode ? '-translate-x-32 opacity-0 pointer-events-none blur-sm' : 'translate-x-0 opacity-100 blur-0'}
        bg-zen-bg border border-zen-border/30 rounded-full shadow-2xl shadow-black/40
      `}
    >
      <nav className="flex flex-col items-center gap-1">
        <NavItem view={AppView.SEARCH} icon={Search} label="Search" />
        <NavItem view={AppView.EDITOR} icon={NotebookPen} label="Thoughts" />
        <NavItem view={AppView.GRAPH} icon={Network} label="Graph View" />
        <NavItem view={AppView.AGENDA} icon={CalendarDays} label="Agenda" />
      </nav>

      <div className="h-8 w-full flex items-center justify-center opacity-5 my-2">
         <div className="w-0.5 h-0.5 rounded-full bg-stone-500"></div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={onNewNote}
          className="
            group relative flex items-center justify-center w-10 h-10 rounded-xl
            text-stone-600 hover:text-stone-300
            hover:bg-stone-800/30 border border-transparent hover:border-stone-700/30
            transition-all duration-500 ease-fluid
          "
        >
          <Plus size={20} strokeWidth={1.25} className="group-hover:rotate-90 transition-transform duration-700 ease-fluid" />
          
          <div className="
            absolute left-full ml-4 px-3 py-1.5 
            bg-[#1c1917]/90 backdrop-blur-md border border-stone-800/50 
            text-[10px] font-medium tracking-widest uppercase text-stone-400 rounded-lg
            shadow-xl shadow-black/20
            opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0
            transition-all duration-500 ease-fluid delay-100
            pointer-events-none whitespace-nowrap z-50
          ">
            New Thought
          </div>
        </button>

        <button 
          onClick={() => onChangeView(AppView.SETTINGS)}
          className="
            group relative flex items-center justify-center w-10 h-10 rounded-xl
            text-stone-700 hover:text-stone-400 transition-all duration-500 ease-fluid
          "
        >
          <Settings 
             size={18} 
             strokeWidth={1.25} 
             className="opacity-70 group-hover:opacity-100 group-hover:rotate-45 transition-all duration-1000 ease-fluid" 
          />
           <div className="
            absolute left-full ml-4 px-3 py-1.5 
            bg-[#1c1917]/90 backdrop-blur-md border border-stone-800/50 
            text-[10px] font-medium tracking-widest uppercase text-stone-400 rounded-lg
            shadow-xl shadow-black/20
            opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0
            transition-all duration-500 ease-fluid delay-100
            pointer-events-none whitespace-nowrap z-50
          ">
            Config
          </div>
        </button>
      </div>
    </div>
  );
};
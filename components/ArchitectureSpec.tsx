import React from 'react';
import { Cpu, FolderTree, Layers, Code, Box } from 'lucide-react';

export const ArchitectureSpec = () => {
  return (
    <div className="max-w-5xl mx-auto pt-12 pb-24 px-8 text-zen-body animate-fade-in">
      <header className="mb-12 border-b border-zen-border pb-6">
        <div className="flex items-center gap-3 mb-2 text-zen-accent">
          <Cpu size={28} />
          <span className="text-sm font-bold tracking-widest uppercase">Technical Spec</span>
        </div>
        <h1 className="text-4xl font-serif text-zen-heading">Frontend Component Architecture</h1>
        <p className="mt-4 text-xl font-light text-zen-muted">
          Blueprint for a scalable, high-performance "Zen" application using Next.js 14+, TipTap, and WebGL.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        
        {/* 1. Directory Structure */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <FolderTree className="text-zen-accent" size={24} />
            1. Directory Structure (Next.js App Router)
          </h2>
          <div className="bg-zen-surface p-6 rounded-2xl border border-zen-border font-mono text-sm leading-relaxed overflow-x-auto">
            <pre className="text-zen-body">
{`src/
├── app/                        # Next.js App Router (Routes)
│   ├── (main)/                 # Main authenticated layout
│   │   ├── editor/[noteId]/    # Note Editor Page
│   │   ├── graph/              # Full-screen Graph Page
│   │   └── layout.tsx          # Main Layout (Sidebar + Shell)
│   ├── (auth)/                 # Login/Signup routes
│   ├── api/                    # Route Handlers (Edge Runtime)
│   ├── globals.css             # Tailwind imports & CSS Variables
│   └── layout.tsx              # Root Layout (Fonts, Providers)
├── components/
│   ├── editor/                 # TipTap Component Ecosystem
│   │   ├── BlockEditor.tsx     # Main wrapper
│   │   ├── extensions/         # Custom TipTap extensions
│   │   │   ├── ImageBlock.tsx
│   │   │   └── SlashCmd.tsx
│   │   └── BubbleMenu.tsx      # Floating text controls
│   ├── graph/                  # Visualization Components
│   │   ├── KnowledgeGraph.tsx  # ForceGraph wrapper (NoSSR)
│   │   └── GraphControls.tsx   # Filtering/Physics toggles
│   ├── ui/                     # Design System Primitives
│   │   ├── Button.tsx
│   │   ├── Dialog.tsx
│   │   └── ZenToggle.tsx       # Focus mode switch
│   └── agenda/                 # Task Management
├── lib/
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useUIStore.ts       # Zustand Global Store
│   │   └── useKeyboard.ts      # Hotkey handlers
│   ├── supabase/               # Supabase Client & Types
│   └── utils.ts                # cn(), formatters
├── styles/
│   └── themes.ts               # CSS Variable mappings
└── types/                      # Global TypeScript Interfaces`}
            </pre>
          </div>
        </section>

        {/* 2. Core Component Breakdown */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Box className="text-zen-accent" size={24} />
            2. Core Component Strategy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Editor */}
            <div className="bg-zen-surface p-6 rounded-xl border border-zen-border">
              <h3 className="text-lg font-medium text-zen-heading mb-3 flex items-center gap-2">
                <Code size={18} /> BlockEditor.tsx (TipTap)
              </h3>
              <p className="text-sm mb-4">
                A headless wrapper around TipTap. We strictly separate "Content State" (JSON) from "UI Rendering".
              </p>
              <ul className="list-disc ml-5 space-y-2 text-sm text-zen-muted marker:text-zen-accent">
                <li>
                  <strong className="text-zen-body">Extensions:</strong> Use <code>@tiptap/extension-image</code> wrapped in a custom React component for resizing handles.
                </li>
                <li>
                  <strong className="text-zen-body">Storage:</strong> Debounced save (1000ms) to Supabase. LocalStorage fallback for offline support.
                </li>
                <li>
                  <strong className="text-zen-body">Rendering:</strong> styling via Tailwind Typography (<code>prose prose-stone</code>) with custom overrides in <code>globals.css</code> for the "Zen" warm gray look.
                </li>
              </ul>
            </div>

            {/* Graph */}
            <div className="bg-zen-surface p-6 rounded-xl border border-zen-border">
              <h3 className="text-lg font-medium text-zen-heading mb-3 flex items-center gap-2">
                <Code size={18} /> KnowledgeGraph.tsx (WebGL)
              </h3>
              <p className="text-sm mb-4">
                High-performance visualization using <code>react-force-graph-2d</code> or <code>-3d</code>.
              </p>
              <ul className="list-disc ml-5 space-y-2 text-sm text-zen-muted marker:text-zen-accent">
                <li>
                  <strong className="text-zen-body">Code Splitting:</strong> Must be dynamically imported with <code>ssr: false</code> to avoid Next.js server errors.
                </li>
                <li>
                  <strong className="text-zen-body">Performance:</strong> Use a Web Worker for physics simulation calculation if node count > 500.
                </li>
                <li>
                  <strong className="text-zen-body">Interactivity:</strong> <code>onNodeClick</code> triggers a drawer slide-over (Context Pane) instead of full page navigation to preserve context.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. State Management */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Layers className="text-zen-accent" size={24} />
            3. State Management (Zustand)
          </h2>
          <div className="bg-zen-surface p-6 rounded-2xl border border-zen-border">
            <p className="mb-4 text-sm">
              We avoid complex Redux boilerplate. <strong>Zustand</strong> is used for transient UI state (Sidebar, Zen Mode), while <strong>React Query</strong> (TanStack Query) handles server state (Notes, Tasks).
            </p>
            
            <div className="bg-zen-bg p-4 rounded-lg border border-zen-border font-mono text-xs">
              <span className="text-gray-500">// src/lib/stores/useUIStore.ts</span>
              <pre className="mt-2 text-blue-400">
{`import { create } from 'zustand';

interface UIState {
  isZenMode: boolean;
  isSidebarOpen: boolean;
  toggleZenMode: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isZenMode: false,
  isSidebarOpen: true,
  
  toggleZenMode: () => set((state) => ({ 
    isZenMode: !state.isZenMode,
    // Zen mode implicitly closes sidebar for immersion
    isSidebarOpen: state.isZenMode 
  })),
  
  toggleSidebar: () => set((state) => ({ 
    isSidebarOpen: !state.isSidebarOpen 
  })),
}));`}
              </pre>
            </div>
            
            <div className="mt-4 p-4 bg-amber-900/10 border border-amber-900/30 rounded text-sm text-amber-500">
              <strong>Architecture Note:</strong> When <code>isZenMode</code> is true, the <code>Layout.tsx</code> component conditionally applies a CSS class <code>.zen-active</code> to the body, which triggers CSS transitions for opacity/padding on all chrome elements.
            </div>
          </div>
        </section>

        {/* 4. Tech Stack */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Box className="text-zen-accent" size={24} />
            4. Recommended Tech Stack
          </h2>
          <div className="bg-zen-surface p-6 rounded-2xl border border-zen-border">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-zen-muted uppercase bg-zen-bg border-b border-zen-border">
                    <tr>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Library / Tool</th>
                        <th className="px-6 py-3">Why?</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zen-border">
                    <tr className="bg-zen-surface hover:bg-zen-bg/50">
                        <td className="px-6 py-4 font-medium text-zen-heading">Core</td>
                        <td className="px-6 py-4">Next.js 14 (App Router)</td>
                        <td className="px-6 py-4">React Server Components for fast initial note load.</td>
                    </tr>
                    <tr className="bg-zen-surface hover:bg-zen-bg/50">
                        <td className="px-6 py-4 font-medium text-zen-heading">Styling</td>
                        <td className="px-6 py-4">Tailwind CSS + <br/>tailwind-merge</td>
                        <td className="px-6 py-4">Utility-first for rapid "Eye Care" theming.</td>
                    </tr>
                    <tr className="bg-zen-surface hover:bg-zen-bg/50">
                        <td className="px-6 py-4 font-medium text-zen-heading">Editor</td>
                        <td className="px-6 py-4">@tiptap/react</td>
                        <td className="px-6 py-4">Best-in-class headless block editor framework.</td>
                    </tr>
                    <tr className="bg-zen-surface hover:bg-zen-bg/50">
                        <td className="px-6 py-4 font-medium text-zen-heading">State</td>
                        <td className="px-6 py-4">Zustand</td>
                        <td className="px-6 py-4">Minimalist store for UI toggles.</td>
                    </tr>
                    <tr className="bg-zen-surface hover:bg-zen-bg/50">
                        <td className="px-6 py-4 font-medium text-zen-heading">Visualization</td>
                        <td className="px-6 py-4">react-force-graph-2d</td>
                        <td className="px-6 py-4">Canvas/WebGL rendering for large graphs.</td>
                    </tr>
                     <tr className="bg-zen-surface hover:bg-zen-bg/50">
                        <td className="px-6 py-4 font-medium text-zen-heading">Database</td>
                        <td className="px-6 py-4">Supabase (Postgres + pgvector)</td>
                        <td className="px-6 py-4">Relational data + Vector embeddings for AI.</td>
                    </tr>
                </tbody>
             </table>
          </div>
        </section>

      </div>
    </div>
  );
};
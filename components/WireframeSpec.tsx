import React from 'react';
import { GitMerge, LayoutDashboard, Zap, Maximize2, SplitSquareHorizontal, Frame } from 'lucide-react';

export const WireframeSpec = () => {
  return (
    <div className="max-w-5xl mx-auto pt-12 pb-24 px-8 text-zen-body animate-fade-in">
      <header className="mb-12 border-b border-zen-border pb-6">
        <div className="flex items-center gap-3 mb-2 text-zen-accent">
          <Frame size={28} />
          <span className="text-sm font-bold tracking-widest uppercase">UX & Wireframes</span>
        </div>
        <h1 className="text-4xl font-serif text-zen-heading">Information Architecture & Flows</h1>
        <p className="mt-4 text-xl font-light text-zen-muted">
          The structural blueprint for the Synapse experience, prioritizing flow and minimal friction.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        
        {/* 1. Sitemap */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <LayoutDashboard className="text-zen-accent" size={24} />
            1. Sitemap (Information Architecture)
          </h2>
          <div className="bg-zen-surface p-6 rounded-2xl border border-zen-border">
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-start gap-3">
                <span className="text-zen-accent">/dashboard</span>
                <span className="text-zen-muted">The "Home" state. Greeting, daily focus, and recent buffers.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-zen-accent">/editor/[id]</span>
                <span className="text-zen-muted">The core workspace. Supports query params for `?mode=focus` or `?sidebar=graph`.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-zen-accent">/graph</span>
                <span className="text-zen-muted">Full-screen exploration mode.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-zen-accent">/agenda</span>
                <span className="text-zen-muted">Dedicated planning view (though tasks exist contextually elsewhere).</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. User Flows */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <GitMerge className="text-zen-accent" size={24} />
            2. Red Routes (Key User Flows)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Flow 1 */}
            <div className="bg-zen-surface p-6 rounded-xl border border-zen-border">
              <h3 className="text-lg font-medium text-zen-heading mb-3 flex items-center gap-2">
                <Zap size={18} /> Journey 1: Quick Capture
              </h3>
              <p className="text-xs text-zen-muted uppercase tracking-wider mb-4">Goal: Capture idea in under 3 seconds</p>
              <ol className="list-decimal ml-5 space-y-3 text-sm text-zen-body">
                <li>
                  <strong>Trigger:</strong> User presses global hotkey <code>Cmd+K</code>.
                </li>
                <li>
                  <strong>UI Response:</strong> A "Spotlight-style" modal appears centered, dimming the background. Input is auto-focused.
                </li>
                <li>
                  <strong>Action:</strong> User types thought. (Optional: types <code>/task</code> to convert to todo).
                </li>
                <li>
                  <strong>Resolution:</strong> User hits <code>Enter</code>. Modal vanishes immediately. Toast notification "Saved to Inbox" appears bottom-right.
                </li>
              </ol>
            </div>

            {/* Flow 2 */}
            <div className="bg-zen-surface p-6 rounded-xl border border-zen-border">
              <h3 className="text-lg font-medium text-zen-heading mb-3 flex items-center gap-2">
                <SplitSquareHorizontal size={18} /> Journey 2: Digital Gardening
              </h3>
              <p className="text-xs text-zen-muted uppercase tracking-wider mb-4">Goal: Connect a draft to the system</p>
              <ol className="list-decimal ml-5 space-y-3 text-sm text-zen-body">
                <li>
                  <strong>Context:</strong> User is editing a "Draft" note.
                </li>
                <li>
                  <strong>Action:</strong> User presses <code>Cmd+\</code> to toggle "Context Panel" (Split View).
                </li>
                <li>
                  <strong>UI Response:</strong> Editor shrinks to 70% width. Right panel slides in showing "Suggested Connections" (AI) and a mini-graph.
                </li>
                <li>
                  <strong>Interaction:</strong> User drags a node from the mini-graph into the text editor.
                </li>
                <li>
                  <strong>Resolution:</strong> A bi-directional link <code>[[Note Title]]</code> is created in the text.
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* 3. Wireframe Specs */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Maximize2 className="text-zen-accent" size={24} />
            3. Wireframe Specifications
          </h2>
          
          <div className="space-y-8">
            
            {/* Dashboard */}
            <div className="border border-zen-border rounded-xl overflow-hidden">
              <div className="bg-zen-surface px-4 py-2 border-b border-zen-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-900/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-900/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-900/50"></div>
                <span className="ml-4 text-xs font-mono text-zen-muted">View: Dashboard (Home)</span>
              </div>
              <div className="p-8 bg-zen-bg min-h-[300px] flex flex-col items-center justify-center gap-8 text-center">
                 <div className="space-y-2">
                   <div className="text-sm uppercase tracking-widest text-zen-accent">Good Morning</div>
                   <div className="text-4xl font-serif text-zen-heading">Monday, Oct 24</div>
                 </div>
                 
                 <div className="w-full max-w-md bg-zen-surface p-4 rounded border border-zen-border text-left">
                   <div className="flex justify-between mb-2">
                     <span className="text-xs text-zen-muted uppercase">Primary Focus</span>
                     <div className="w-4 h-4 border border-zen-border rounded-full"></div>
                   </div>
                   <div className="text-lg text-zen-body font-serif">Complete the Synapse Architecture Spec</div>
                 </div>

                 <div className="grid grid-cols-3 gap-4 w-full max-w-2xl opacity-60">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-24 border border-zen-border border-dashed rounded flex items-center justify-center text-xs">Recent Note {i}</div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Deep Work Editor */}
            <div className="border border-zen-border rounded-xl overflow-hidden">
              <div className="bg-zen-surface px-4 py-2 border-b border-zen-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-900/50"></div>
                <span className="ml-4 text-xs font-mono text-zen-muted">View: Editor (Split Mode)</span>
              </div>
              <div className="flex h-[400px]">
                {/* Main Canvas */}
                <div className="flex-1 bg-zen-bg p-8 relative">
                   <div className="absolute top-4 right-4">
                      <span className="text-[10px] border border-zen-border px-2 py-1 rounded text-zen-muted">ZEN MODE OFF</span>
                   </div>
                   <div className="max-w-lg mx-auto space-y-4">
                     <div className="h-8 w-3/4 bg-zen-surface rounded"></div>
                     <div className="h-4 w-full bg-zen-surface/50 rounded"></div>
                     <div className="h-4 w-full bg-zen-surface/50 rounded"></div>
                     <div className="h-4 w-2/3 bg-zen-surface/50 rounded"></div>
                   </div>
                </div>
                {/* Context Sidebar */}
                <div className="w-64 border-l border-zen-border bg-zen-surface p-4 flex flex-col gap-4">
                   <div className="text-xs font-bold text-zen-muted uppercase">Semantic Context</div>
                   <div className="h-32 bg-zen-bg rounded border border-zen-border border-dashed flex items-center justify-center text-xs text-zen-muted">[Mini-Graph]</div>
                   <div className="space-y-2">
                      <div className="text-[10px] text-zen-muted uppercase">Relevant Notes</div>
                      <div className="h-8 bg-zen-bg rounded border border-zen-border"></div>
                      <div className="h-8 bg-zen-bg rounded border border-zen-border"></div>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Micro-UX */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Zap className="text-zen-accent" size={24} />
            4. Micro-UX & Behaviors
          </h2>
          <div className="bg-zen-surface p-6 rounded-2xl border border-zen-border">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <strong className="text-zen-heading block mb-2">The Zen Toggle Logic</strong>
                 <p className="text-sm text-zen-body mb-2">
                   When "Zen Mode" is activated:
                 </p>
                 <ul className="list-disc ml-5 space-y-1 text-sm text-zen-muted">
                   <li><strong>Main Sidebar:</strong> Slides out to the left (`transform: translateX(-100%)`).</li>
                   <li><strong>Context Panel:</strong> Fades out.</li>
                   <li><strong>Editor Width:</strong> Transitions from `max-w-3xl` to `max-w-2xl` (tighter focus).</li>
                   <li><strong>Typography:</strong> Everything except the active block dims to 50% opacity (Spotlight effect).</li>
                 </ul>
               </div>
               <div>
                 <strong className="text-zen-heading block mb-2">The "Alive" Graph</strong>
                 <p className="text-sm text-zen-body mb-2">
                   The Graph is not static.
                 </p>
                 <ul className="list-disc ml-5 space-y-1 text-sm text-zen-muted">
                   <li><strong>Hovering:</strong> Hovering a node highlights all connected edges and dims the rest of the universe.</li>
                   <li><strong>Physics:</strong> Newly created notes don't just "appear"; they bloom out from their parent/source note using a spring animation.</li>
                 </ul>
               </div>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
};
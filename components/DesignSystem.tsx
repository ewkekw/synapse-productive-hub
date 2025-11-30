import React from 'react';
import { Palette, LayoutTemplate, MousePointerClick, Layers, Eye } from 'lucide-react';

export const DesignSystem = () => {
  return (
    <div className="max-w-4xl mx-auto pt-12 pb-24 px-8 text-zen-body animate-fade-in">
      <header className="mb-12 border-b border-zen-border pb-6">
        <div className="flex items-center gap-3 mb-2 text-zen-accent">
          <Palette size={28} />
          <span className="text-sm font-bold tracking-widest uppercase">Design Architecture</span>
        </div>
        <h1 className="text-5xl font-serif text-zen-heading">Synapse Design System</h1>
        <p className="mt-4 text-xl font-light text-zen-muted">
          A specification for cognitive ease, eye care, and distraction-free productivity.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        
        {/* 1. Design Tokens */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Layers className="text-zen-accent" size={24} />
            1. Design Tokens (Visual Language)
          </h2>
          
          <div className="bg-zen-surface p-8 rounded-2xl border border-zen-border shadow-2xl shadow-black/20">
            <h3 className="text-lg font-medium text-zen-heading mb-4">Color Palette: "Warm Paper"</h3>
            <p className="mb-6 text-sm">
              Optimized to reduce blue-light emission. No pure black (`#000000`) or white (`#FFFFFF`) allowed.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <TokenSwatch name="Background" hex="#181614" desc="Deep Warm Charcoal" bg="bg-[#181614]" />
              <TokenSwatch name="Surface" hex="#201d1b" desc="Card/Panel BG" bg="bg-[#201d1b]" />
              <TokenSwatch name="UI Border" hex="#383430" desc="Subtle Dividers" bg="bg-[#383430]" />
              <TokenSwatch name="Accent" hex="#ca8a04" desc="Amber Focus" bg="bg-[#ca8a04]" />
            </div>

            <h3 className="text-lg font-medium text-zen-heading mb-4">Typography System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-4 border border-zen-border rounded-lg">
                <span className="text-4xl font-serif text-zen-heading block mb-2">Lora</span>
                <span className="text-xs uppercase tracking-wider text-zen-accent">Serif • For Thought</span>
                <p className="mt-2 text-sm">Used for H1-H3 headings and long-form editor content to mimic the flow of reading a book.</p>
              </div>
              <div className="p-4 border border-zen-border rounded-lg">
                <span className="text-4xl font-sans text-zen-heading block mb-2">Inter</span>
                <span className="text-xs uppercase tracking-wider text-zen-accent">Sans • For UI</span>
                <p className="mt-2 text-sm">Used for UI labels, metadata, agenda items, and graph labels for maximum legibility.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Layout Architecture */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <LayoutTemplate className="text-zen-accent" size={24} />
            2. Core Layout Architecture
          </h2>
          <div className="bg-zen-surface p-8 rounded-2xl border border-zen-border">
            <div className="flex flex-col gap-6">
              <div>
                <strong className="text-zen-heading block text-lg mb-2">The Three-Pane Fluid Layout</strong>
                <p className="mb-4">
                  The interface transforms based on the user's mental state.
                </p>
                <ul className="list-disc ml-5 space-y-2 marker:text-zen-accent">
                  <li><strong className="text-zen-heading">Navigation (Left):</strong> Collapsed icon rail. Fades out completely in "Writing Mode".</li>
                  <li><strong className="text-zen-heading">Canvas (Center):</strong> The primary focus area. Max-width 72ch (approx 700px) for optimal reading line length.</li>
                  <li><strong className="text-zen-heading">Context (Right - Hidden/Overlay):</strong> graph connections or meta-data. Appears only on demand.</li>
                </ul>
              </div>
              
              <div className="p-4 bg-zen-bg rounded border border-zen-border flex items-center justify-center h-32 opacity-50">
                 [Layout Diagram Visualization: Nav | Editor | Graph]
              </div>
            </div>
          </div>
        </section>

        {/* 3. Component Deep Dive */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <Eye className="text-zen-accent" size={24} />
            3. Component Deep-Dive
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zen-surface p-6 rounded-xl border border-zen-border">
              <h3 className="text-lg font-medium text-zen-heading mb-3">The Editor</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="text-zen-accent">▸</span>
                  <span>**Blocks:** No visible borders until hovered. Active block gets subtle left accent line.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zen-accent">▸</span>
                  <span>**Slash Commands:** Triggering `/` opens a minimal popover (dark glass morphism).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zen-accent">▸</span>
                  <span>**Selection:** Text selection color is `#451a03` (deep amber) instead of standard system blue.</span>
                </li>
              </ul>
            </div>

            <div className="bg-zen-surface p-6 rounded-xl border border-zen-border">
              <h3 className="text-lg font-medium text-zen-heading mb-3">The Semantic Graph</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="text-zen-accent">▸</span>
                  <span>**Visual Clustering:** Distant nodes fade to 20% opacity. Only 1st and 2nd degree connections to the active note are fully opaque.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zen-accent">▸</span>
                  <span>**Edges:** Solid lines = Explicit links. Dashed lines = AI-suggested semantic links.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Interaction Design */}
        <section>
          <h2 className="text-2xl font-serif text-zen-heading mb-6 flex items-center gap-3">
            <MousePointerClick className="text-zen-accent" size={24} />
            4. Interaction Design (UX)
          </h2>
          <div className="bg-zen-surface p-8 rounded-2xl border border-zen-border">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-zen-heading">Creating a Note (The "Flow")</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  1. User clicks "+" or presses `Cmd+N`.<br/>
                  2. Editor creates a blank slate. Focus immediately on "Title".<br/>
                  3. **Micro-interaction:** The "Save" status indicator does not show "Saved"; it simply pulses a small amber dot that fades when synced, reducing text clutter.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zen-heading">Transition: Writing → Graph</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  When switching views, do not hard-cut.
                  <br/>
                  **Animation:** The text editor creates a "zoom out" effect, dissolving into a node in the center of the screen, while other nodes fly in from the periphery. This establishes the mental model that "The note is just one point in the system."
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

const TokenSwatch = ({ name, hex, desc, bg }: { name: string, hex: string, desc: string, bg: string }) => (
  <div className="flex flex-col gap-2">
    <div className={`w-full h-16 rounded-lg border border-zen-border shadow-inner ${bg}`}></div>
    <div>
      <span className="block text-zen-heading font-medium text-sm">{name}</span>
      <span className="block text-xs font-mono text-zen-muted uppercase">{hex}</span>
      <span className="block text-xs text-zen-body mt-1">{desc}</span>
    </div>
  </div>
);

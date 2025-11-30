import React from 'react';
import { Shield, Database, Brain, Palette } from 'lucide-react';

export const SettingsSpec = () => {
  return (
    <div className="max-w-4xl mx-auto pt-12 pb-24 px-8 text-stone-400">
      <h1 className="text-4xl font-serif text-stone-200 mb-8 border-b border-stone-800 pb-4">Product Specification & Architecture</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Section 1: Vision */}
        <div className="col-span-full bg-stone-900/50 p-6 rounded-xl border border-stone-800">
          <h2 className="text-xl font-semibold text-amber-600 mb-3 flex items-center gap-2">
             <Brain size={20}/> Vision
          </h2>
          <p className="leading-relaxed">
            Synapse is designed to reduce digital eye strain and cognitive overload. By merging Zettelkasten note-taking with automated semantic organization, it acts as a "Second Brain" that works for you, not against you. The UI adheres to "Zen" principles: warm dark modes, minimal distractions, and clear typography.
          </p>
        </div>

        {/* Section 2: Stack */}
        <div className="bg-stone-900/30 p-6 rounded-xl border border-stone-800">
          <h2 className="text-xl font-semibold text-stone-300 mb-3 flex items-center gap-2">
             <Database size={20}/> Tech Stack
          </h2>
          <ul className="list-disc ml-5 space-y-2 text-sm">
            <li><strong className="text-stone-300">Frontend:</strong> React 18, TypeScript, Tailwind CSS.</li>
            <li><strong className="text-stone-300">State:</strong> React Context + Local Storage (MVP).</li>
            <li><strong className="text-stone-300">AI:</strong> Google Gemini API (gemini-2.5-flash for tagging, gemini-3-pro for graph logic).</li>
            <li><strong className="text-stone-300">Visualization:</strong> D3.js (Force Directed Graph).</li>
          </ul>
        </div>

        {/* Section 3: Supabase Architecture */}
        <div className="bg-stone-900/30 p-6 rounded-xl border border-stone-800">
          <h2 className="text-xl font-semibold text-stone-300 mb-3 flex items-center gap-2">
             <Shield size={20}/> Security & Data (Supabase)
          </h2>
          <div className="space-y-4 text-sm">
             <div>
                <strong className="text-amber-700 block mb-1">Row Level Security (RLS) Strategy</strong>
                <p>Private notes are secured via Postgres Policies. Data is strictly isolated by `user_id`.</p>
                <code className="block mt-2 bg-stone-950 p-2 rounded text-xs text-green-700 font-mono">
                  CREATE POLICY "Private Notes" ON notes<br/>
                  FOR ALL USING (auth.uid() = user_id);
                </code>
             </div>
             <div>
                <strong className="text-amber-700 block mb-1">Vector Search</strong>
                <p>Uses `pgvector` to store embeddings for semantic similarity search, enabling the "related notes" feature without manual linking.</p>
             </div>
          </div>
        </div>

        {/* Section 4: UX Guidelines */}
        <div className="col-span-full bg-stone-900/30 p-6 rounded-xl border border-stone-800">
          <h2 className="text-xl font-semibold text-stone-300 mb-3 flex items-center gap-2">
             <Palette size={20}/> UX & Eye-Care Palette
          </h2>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#1c1917] border border-stone-700 mb-2"></div>
              <span className="text-xs">Background</span>
              <span className="text-xs font-mono text-stone-500">#1c1917</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#a8a29e] mb-2"></div>
              <span className="text-xs">Text</span>
              <span className="text-xs font-mono text-stone-500">#a8a29e</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#ca8a04] mb-2"></div>
              <span className="text-xs">Accent</span>
              <span className="text-xs font-mono text-stone-500">#ca8a04</span>
            </div>
             <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#292524] mb-2"></div>
              <span className="text-xs">Surface</span>
              <span className="text-xs font-mono text-stone-500">#292524</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
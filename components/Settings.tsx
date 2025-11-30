import React, { useState, useEffect } from 'react';
import { 
  Trash2, DownloadCloud, 
  Fingerprint, Waypoints, Sparkles, Archive,
  CheckCircle2, AlertCircle, 
  Database, Zap, ChevronRight, Terminal, 
  Key, RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { INITIAL_NOTES, INITIAL_TASKS } from '../constants';
import { saveNotes, saveTasks, getNotes, getTasks, transformNoteForCloud } from '../services/storageService';

type SettingsTab = 'identity' | 'cloud' | 'cortex' | 'system';
type ConnectionStatus = 'idle' | 'checking' | 'valid' | 'invalid';

const TabButton = ({ 
  id, 
  activeId, 
  icon: Icon, 
  label, 
  onClick 
}: { 
  id: SettingsTab, 
  activeId: SettingsTab, 
  icon: any, 
  label: string, 
  onClick: (id: SettingsTab) => void 
}) => {
  const isActive = id === activeId;
  return (
    <button 
      onClick={() => onClick(id)}
      className={`
        w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-500 ease-fluid group relative overflow-hidden
        ${isActive ? 'bg-zen-surface text-zen-heading shadow-lg' : 'text-zen-muted hover:bg-zen-surface/30 hover:text-zen-body'}
      `}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zen-accent" />}
      <Icon 
        size={20} 
        strokeWidth={1.5} 
        className={`transition-colors duration-300 ${isActive ? 'text-zen-accent' : 'group-hover:text-zen-heading'}`} 
      />
      <span className="text-sm font-medium tracking-wide">{label}</span>
      {isActive && <ChevronRight size={14} className="ml-auto text-zen-accent animate-enter-fast" />}
    </button>
  );
};

const SectionHeader = ({ title, description, icon: Icon }: { title: string, description: string, icon?: any }) => (
  <div className="mb-8 border-b border-zen-border/40 pb-6">
    <div className="flex items-center gap-3 mb-2">
      {Icon && <div className="p-2 bg-zen-surface rounded-lg text-zen-accent"><Icon size={20} /></div>}
      <h2 className="text-2xl font-serif text-zen-heading">{title}</h2>
    </div>
    <p className="text-sm text-zen-muted leading-relaxed max-w-2xl font-light">
      {description}
    </p>
  </div>
);

const StatusBadge = ({ status, labelValid = "Operational", labelInvalid = "Disconnected" }: { status: ConnectionStatus, labelValid?: string, labelInvalid?: string }) => {
  if (status === 'valid') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <CheckCircle2 size={12} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{labelValid}</span>
      </div>
    );
  }
  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <RefreshCw size={12} className="animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Verifying...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zen-surface border border-zen-border text-zen-muted">
      <AlertCircle size={12} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{labelInvalid}</span>
    </div>
  );
};

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  
  const [userName, setUserName] = useState('Traveler');
  const [userRole, setUserRole] = useState('Architect');
  const [stats, setStats] = useState({ notes: 0, tasks: 0, words: 0 });

  const [rawSnippet, setRawSnippet] = useState('');
  const [parsedConfig, setParsedConfig] = useState<any>(null);
  const [fbStatus, setFbStatus] = useState<ConnectionStatus>('idle');
  const [configStep, setConfigStep] = useState(1);

  const [apiKey, setApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState<ConnectionStatus>('idle');

  useEffect(() => {
    const savedName = localStorage.getItem('synapse_user_name');
    const savedRole = localStorage.getItem('synapse_user_role');
    const savedFb = localStorage.getItem('synapse_firebase_config');
    const savedKey = localStorage.getItem('synapse_ai_key');

    if (savedName) setUserName(savedName);
    if (savedRole) setUserRole(savedRole);
    
    if (savedFb) {
        try {
            const config = JSON.parse(savedFb);
            setParsedConfig(config);
            setFbStatus('valid');
            setConfigStep(3); 
        } catch (e) { }
    }
    
    if (savedKey) {
        setApiKey(savedKey);
        setAiStatus('idle'); 
    }

    const notes = getNotes();
    const tasks = getTasks();
    let wordCount = 0;
    notes.forEach(n => n.blocks.forEach(b => { if (b.content) wordCount += b.content.split(/\s+/).length; }));
    setStats({ notes: notes.length, tasks: tasks.length, words: wordCount });
  }, []);

  const handleSaveProfile = () => {
      localStorage.setItem('synapse_user_name', userName);
      localStorage.setItem('synapse_user_role', userRole);
  };

  const handleSmartParse = (input: string) => {
    setRawSnippet(input);
    
    const apiKey = input.match(/(?:apiKey|api_key)["']?\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    const projectId = input.match(/(?:projectId|project_id)["']?\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    const authDomain = input.match(/(?:authDomain|auth_domain)["']?\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    const storageBucket = input.match(/(?:storageBucket|storage_bucket)["']?\s*[:=]\s*["']([^"']+)["']/i)?.[1];
    
    if (apiKey && projectId) {
        const config = { apiKey, projectId, authDomain, storageBucket };
        setParsedConfig(config);
        setFbStatus('valid');
        setConfigStep(3);
        localStorage.setItem('synapse_firebase_config', JSON.stringify(config));
    } else {
        setFbStatus('invalid');
        setParsedConfig(null);
    }
  };

  const handleTestAI = async () => {
      setAiStatus('checking');
      try {
          const ai = new GoogleGenAI({ apiKey });
          await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'ping', config: { maxOutputTokens: 1 } });
          setAiStatus('valid');
          localStorage.setItem('synapse_ai_key', apiKey);
      } catch (e) {
          setAiStatus('invalid');
      }
  };

  const handleExportData = () => {
    const notes = getNotes();
    const cloudNotes = notes.map(transformNoteForCloud);
    const data = {
        notes: cloudNotes,
        tasks: getTasks(),
        user: { name: userName, role: userRole },
        meta: { version: '1.0', exportedAt: new Date().toISOString() }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
      if (confirm("WARNING: This will obliterate all local data. Are you absolutely sure?")) {
          localStorage.clear();
          saveNotes(INITIAL_NOTES);
          saveTasks(INITIAL_TASKS);
          window.location.reload();
      }
  };

  return (
    <div className="max-w-7xl mx-auto pt-12 pb-24 px-6 md:px-12 flex flex-col lg:flex-row gap-16 h-full text-zen-body animate-enter-slow">
       
       <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
           <div className="px-2">
               <h1 className="text-4xl font-serif text-zen-heading tracking-tight">System</h1>
               <div className="text-xs text-zen-muted mt-2 font-mono uppercase tracking-widest opacity-60 pl-1">Configuration & Control</div>
           </div>
           
           <nav className="flex flex-col gap-2">
               <TabButton id="identity" activeId={activeTab} icon={Fingerprint} label="Identity" onClick={setActiveTab} />
               <TabButton id="cloud" activeId={activeTab} icon={Waypoints} label="Synapse Cloud" onClick={setActiveTab} />
               <TabButton id="cortex" activeId={activeTab} icon={Sparkles} label="Cortex (AI)" onClick={setActiveTab} />
               <TabButton id="system" activeId={activeTab} icon={Archive} label="Data System" onClick={setActiveTab} />
           </nav>

           <div className="mt-auto p-6 bg-zen-surface/30 rounded-2xl border border-zen-border/30 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase text-zen-muted mb-4 tracking-widest">System Health</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zen-body">Database</span>
                        <div className={`w-2 h-2 rounded-full ${fbStatus === 'valid' ? 'bg-emerald-500 shadow-glow' : 'bg-zen-border'}`} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zen-body">Neural Engine</span>
                        <div className={`w-2 h-2 rounded-full ${aiStatus === 'valid' ? 'bg-emerald-500 shadow-glow' : 'bg-zen-border'}`} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zen-body">Storage</span>
                        <span className="font-mono text-xs text-zen-muted">{Math.round((JSON.stringify(getNotes()).length / 1024))} KB</span>
                    </div>
                </div>
           </div>
       </aside>

       <main className="flex-1 min-w-0">
           
           {activeTab === 'identity' && (
               <div className="animate-fade-in">
                   <SectionHeader 
                        title="Digital Identity" 
                        description="Define how you appear within the Synapse ecosystem. These details are attached to your metadata exports."
                        icon={Fingerprint}
                   />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                       <div className="space-y-3">
                           <label className="text-xs font-bold text-zen-muted uppercase tracking-wider ml-1">Display Name</label>
                           <input 
                               value={userName} 
                               onChange={(e) => setUserName(e.target.value)}
                               onBlur={handleSaveProfile}
                               className="w-full bg-zen-surface border border-zen-border/50 rounded-xl px-5 py-4 text-lg text-zen-heading focus:border-zen-accent focus:ring-1 focus:ring-zen-accent/50 focus:outline-none transition-all"
                           />
                       </div>
                       <div className="space-y-3">
                           <label className="text-xs font-bold text-zen-muted uppercase tracking-wider ml-1">Role / Archetype</label>
                           <input 
                               value={userRole} 
                               onChange={(e) => setUserRole(e.target.value)}
                               onBlur={handleSaveProfile}
                               className="w-full bg-zen-surface border border-zen-border/50 rounded-xl px-5 py-4 text-lg text-zen-heading focus:border-zen-accent focus:ring-1 focus:ring-zen-accent/50 focus:outline-none transition-all"
                           />
                       </div>
                   </div>

                   <h3 className="text-lg font-serif text-zen-heading mb-6">Quantified Self</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-6 bg-zen-surface rounded-2xl border border-zen-border/50 flex flex-col items-center justify-center gap-2 group hover:border-zen-accent/30 transition-colors">
                           <div className="p-3 bg-zen-bg rounded-full text-zen-heading mb-1 group-hover:scale-110 transition-transform"><Database size={24} strokeWidth={1.5}/></div>
                           <div className="text-4xl font-serif text-zen-heading">{stats.notes}</div>
                           <div className="text-xs text-zen-muted font-mono uppercase tracking-widest">Total Thoughts</div>
                       </div>
                       <div className="p-6 bg-zen-surface rounded-2xl border border-zen-border/50 flex flex-col items-center justify-center gap-2 group hover:border-zen-accent/30 transition-colors">
                            <div className="p-3 bg-zen-bg rounded-full text-zen-heading mb-1 group-hover:scale-110 transition-transform"><Terminal size={24} strokeWidth={1.5}/></div>
                           <div className="text-4xl font-serif text-zen-heading">{stats.words}</div>
                           <div className="text-xs text-zen-muted font-mono uppercase tracking-widest">Words Written</div>
                       </div>
                       <div className="p-6 bg-zen-surface rounded-2xl border border-zen-border/50 flex flex-col items-center justify-center gap-2 group hover:border-zen-accent/30 transition-colors">
                            <div className="p-3 bg-zen-bg rounded-full text-zen-heading mb-1 group-hover:scale-110 transition-transform"><CheckCircle2 size={24} strokeWidth={1.5}/></div>
                           <div className="text-4xl font-serif text-zen-heading">{stats.tasks}</div>
                           <div className="text-xs text-zen-muted font-mono uppercase tracking-widest">Tasks Tracked</div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === 'cloud' && (
               <div className="animate-fade-in">
                   <div className="flex justify-between items-start mb-8">
                       <SectionHeader 
                            title="Synapse Cloud" 
                            description="Configure your backend storage."
                            icon={Waypoints}
                        />
                        <StatusBadge status={fbStatus} />
                   </div>

                   <div className="bg-zen-surface/30 rounded-3xl border border-zen-border/50 overflow-hidden mb-12">
                       <div className="flex border-b border-zen-border/30">
                           {[1, 2, 3].map((step) => (
                               <div 
                                    key={step}
                                    className={`
                                        flex-1 py-4 flex flex-col items-center gap-1 border-r border-zen-border/30 last:border-0
                                        ${configStep === step ? 'bg-zen-surface' : 'bg-transparent'}
                                        ${configStep > step ? 'text-emerald-500' : (configStep === step ? 'text-zen-accent' : 'text-zen-muted/30')}
                                    `}
                               >
                                   <span className="text-xs font-bold uppercase tracking-widest">Step {step}</span>
                                   <span className="text-xs font-medium">
                                       {step === 1 && "Retrieve"}
                                       {step === 2 && "Inject"}
                                       {step === 3 && "Verify"}
                                   </span>
                               </div>
                           ))}
                       </div>

                       <div className="p-8">
                           {configStep === 1 && (
                               <div className="space-y-6 animate-slide-up-fade">
                                   <div className="flex items-start gap-4">
                                       <div className="w-10 h-10 rounded-full bg-zen-bg flex items-center justify-center border border-zen-border text-zen-heading shrink-0 font-serif text-xl">1</div>
                                       <div>
                                           <h3 className="text-lg font-bold text-zen-heading mb-2">Retrieve Configuration</h3>
                                           <p className="text-sm text-zen-muted leading-relaxed mb-4">
                                               Navigate to your Firebase Console &rarr; Project Settings. Scroll down to the "Your apps" section. 
                                               Ensure you select the <strong>Config</strong> radio button (not CDN).
                                           </p>
                                           <button onClick={() => setConfigStep(2)} className="px-6 py-2 bg-zen-heading text-zen-bg hover:bg-zen-accent rounded-lg font-bold text-sm transition-colors">
                                               I have the code
                                           </button>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {configStep === 2 && (
                               <div className="space-y-6 animate-slide-up-fade">
                                   <div className="flex items-start gap-4">
                                       <div className="w-10 h-10 rounded-full bg-zen-bg flex items-center justify-center border border-zen-border text-zen-heading shrink-0 font-serif text-xl">2</div>
                                       <div className="w-full">
                                           <h3 className="text-lg font-bold text-zen-heading mb-2">Inject Configuration</h3>
                                           <p className="text-sm text-zen-muted mb-4">
                                               Paste the entire code block below. Our parser will extract the keys automatically.
                                           </p>
                                           
                                           <div className="relative group">
                                                <div className="absolute top-0 left-0 right-0 h-6 bg-[#0d1117] border-b border-zen-border/30 rounded-t-lg flex items-center px-3 gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                                    <span className="ml-2 text-[9px] font-mono text-zen-muted opacity-50">config.js</span>
                                                </div>
                                                <textarea 
                                                    value={rawSnippet}
                                                    onChange={(e) => handleSmartParse(e.target.value)}
                                                    placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "..."\n};`}
                                                    className="w-full h-48 bg-[#0d1117] text-blue-200 font-mono text-xs pt-8 p-4 rounded-lg border border-zen-border/50 focus:border-zen-accent focus:outline-none resize-none shadow-inner"
                                                />
                                           </div>
                                           {fbStatus === 'invalid' && rawSnippet.length > 10 && (
                                               <p className="text-xs text-red-400 mt-2 flex items-center gap-2"><AlertCircle size={12}/> Could not parse configuration. Check format.</p>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           )}

                           {configStep === 3 && parsedConfig && (
                               <div className="space-y-6 animate-slide-up-fade">
                                    <div className="flex flex-col items-center justify-center text-center py-8">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 shadow-glow">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-zen-heading mb-2">System Operational</h3>
                                        <p className="text-sm text-zen-muted mb-6">Your data link is active.</p>
                                        
                                        <div className="w-full max-w-sm bg-zen-bg rounded-lg p-4 border border-zen-border/50">
                                            <div className="flex justify-between text-xs py-1 border-b border-zen-border/30">
                                                <span className="text-zen-muted">Project ID</span>
                                                <span className="font-mono text-zen-accent">{parsedConfig.projectId}</span>
                                            </div>
                                            <div className="flex justify-between text-xs py-1 pt-2">
                                                <span className="text-zen-muted">Auth Domain</span>
                                                <span className="font-mono text-zen-accent">{parsedConfig.authDomain}</span>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => setConfigStep(2)} className="mt-6 text-xs text-zen-muted hover:text-zen-heading underline decoration-zen-border">
                                            Reconfigure
                                        </button>
                                    </div>
                               </div>
                           )}
                       </div>
                   </div>

                   <div className="p-8 border border-dashed border-zen-border/40 rounded-3xl">
                       <h3 className="text-sm font-bold text-zen-heading mb-6 flex items-center gap-2">
                           <Database size={16} className="text-zen-accent"/> Intelligent Storage Schema
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="p-4 bg-zen-surface rounded-xl border border-zen-border/30 relative">
                               <div className="text-xs font-mono text-zen-muted mb-2 uppercase">Input</div>
                               <div className="text-lg font-serif text-zen-heading">Block Data</div>
                               <div className="text-xs text-zen-muted mt-1">Rich Text JSON</div>
                               <div className="absolute top-1/2 -right-3 w-6 h-[1px] bg-zen-border z-10 hidden md:block"></div>
                           </div>
                           <div className="p-4 bg-zen-surface rounded-xl border border-zen-border/30 relative flex flex-col items-center text-center">
                               <div className="w-8 h-8 rounded-full bg-zen-bg border border-zen-border flex items-center justify-center mb-2">
                                   <Zap size={14} className="text-zen-accent"/>
                               </div>
                               <div className="text-xs font-bold text-zen-heading">Transformer</div>
                               <div className="text-[10px] text-zen-muted mt-1">Parses content structure</div>
                               <div className="absolute top-1/2 -right-3 w-6 h-[1px] bg-zen-border z-10 hidden md:block"></div>
                           </div>
                           <div className="p-4 bg-zen-surface rounded-xl border border-zen-border/30">
                               <div className="text-xs font-mono text-zen-muted mb-2 uppercase">Output</div>
                               <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Pure Markdown</div>
                                    <div className="flex items-center gap-2 text-xs text-amber-400"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Search Index</div>
                                    <div className="flex items-center gap-2 text-xs text-blue-400"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Vector Embedding</div>
                               </div>
                           </div>
                       </div>
                   </div>

               </div>
           )}

           {activeTab === 'cortex' && (
               <div className="animate-fade-in">
                   <div className="flex justify-between items-start mb-8">
                        <SectionHeader 
                            title="Neural Cortex" 
                            description="Configure AI capabilities."
                            icon={Sparkles}
                        />
                        <StatusBadge status={aiStatus} labelValid="Connected" />
                   </div>

                   <div className="bg-zen-surface/20 rounded-2xl border border-zen-border/50 p-8 mb-8">
                       <label className="text-sm font-bold text-zen-heading mb-4 block">API Access Token</label>
                       
                       <div className="relative group mb-6">
                           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                               <Key size={18} className="text-zen-muted group-focus-within:text-zen-accent transition-colors" />
                           </div>
                           <input 
                               type="password"
                               value={apiKey}
                               onChange={(e) => { setApiKey(e.target.value); setAiStatus('idle'); }}
                               placeholder="sk-..."
                               className="w-full bg-zen-bg border border-zen-border rounded-xl pl-12 pr-4 py-4 text-zen-heading font-mono text-sm focus:border-zen-accent focus:ring-1 focus:ring-zen-accent/50 focus:outline-none transition-all"
                           />
                       </div>

                       <div className="flex items-center justify-between">
                            <p className="text-xs text-zen-muted">
                                Your key is stored locally in your browser. It is never sent to our servers.
                            </p>
                            <button 
                                onClick={handleTestAI}
                                disabled={aiStatus === 'checking' || !apiKey}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all
                                    ${aiStatus === 'checking' ? 'bg-zen-surface text-zen-muted' : 'bg-zen-heading text-zen-bg hover:bg-zen-accent hover:text-white'}
                                `}
                            >
                                {aiStatus === 'checking' ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16} fill="currentColor" />}
                                {aiStatus === 'checking' ? 'Verifying...' : 'Initialize Cortex'}
                            </button>
                       </div>
                   </div>

                   <h3 className="text-sm font-bold text-zen-heading mb-4 px-2">Enabled Capabilities</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[
                           { title: 'Semantic Tagging', desc: 'Auto-categorization of thoughts.' },
                           { title: 'Graph Synthesis', desc: 'AI-organized relationship linking.' },
                           { title: 'Executive Function', desc: 'Task breakdown & time estimation.' },
                           { title: 'Natural Language Input', desc: 'Smart agenda parsing.' }
                       ].map((cap, i) => (
                           <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-zen-border/30 bg-zen-surface/10 opacity-80">
                               <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 shadow-glow' : 'bg-zen-border'}`} />
                               <div>
                                   <div className="text-sm font-medium text-zen-heading">{cap.title}</div>
                                   <div className="text-xs text-zen-muted">{cap.desc}</div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {activeTab === 'system' && (
               <div className="animate-fade-in">
                   <SectionHeader 
                        title="Data System" 
                        description="Manage the physical state of your Second Brain."
                        icon={Archive}
                   />

                   <div className="grid grid-cols-1 gap-8">
                       <div className="p-8 bg-zen-surface/20 rounded-3xl border border-zen-border/40 flex items-center justify-between group hover:border-zen-border/60 transition-colors">
                           <div className="max-w-md">
                               <div className="flex items-center gap-3 text-zen-heading font-serif text-xl mb-2">
                                   <DownloadCloud size={24} strokeWidth={1.5} />
                                   Universal Export
                               </div>
                               <p className="text-sm text-zen-muted leading-relaxed">
                                   Generate a portable JSON archive containing all Notes (Markdown formatted), Tasks, and Profile settings.
                               </p>
                           </div>
                           <button 
                               onClick={handleExportData}
                               className="px-8 py-3 bg-zen-surface hover:bg-zen-heading hover:text-zen-bg text-zen-heading border border-zen-border rounded-xl text-sm font-bold transition-all shadow-sm"
                           >
                               Initialize Backup
                           </button>
                       </div>

                       <div className="p-8 bg-red-900/5 rounded-3xl border border-red-900/10 flex items-center justify-between group hover:border-red-500/20 transition-colors">
                           <div className="max-w-md">
                               <div className="flex items-center gap-3 text-red-400 font-serif text-xl mb-2">
                                   <Trash2 size={24} strokeWidth={1.5} />
                                   System Purge
                               </div>
                               <p className="text-sm text-red-400/60 leading-relaxed">
                                   Irreversibly wipes all local storage, API keys, and cache. This action cannot be undone.
                               </p>
                           </div>
                           <button 
                               onClick={handleReset}
                               className="px-8 py-3 bg-transparent hover:bg-red-500/10 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-sm font-bold transition-all"
                           >
                               Execute Reset
                           </button>
                       </div>
                   </div>
               </div>
           )}

       </main>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, Maximize2, Circle, CheckCircle2, ArrowRight, NotebookPen, History, Dices } from 'lucide-react';
import { Note, Task, AppView } from '../types';
import * as d3 from 'd3';

interface SearchPageProps {
  recentNotes: Note[];
  todaysTasks: Task[];
  notes: Note[]; 
  onNavigateToNote: (noteId: string) => void;
  onChangeView: (view: AppView) => void;
  onToggleTask: (taskId: string) => void;
}

// --- Zen Philosophy Quotes (Curated) ---
const ZEN_QUOTES = [
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "Simplify, then add lightness.", author: "Colin Chapman" },
  { text: "The mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Smile, breathe and go slowly.", author: "Thich Nhat Hanh" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Edit your life frequently and ruthlessly. It's your masterpiece after all.", author: "Nathan W. Morris" },
  { text: "Muddy water is best cleared by leaving it alone.", author: "Alan Watts" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Do less, but with more focus.", author: "Essentialism" },
  { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" }
];

// --- Organic Dot Matrix Logo (Responsive & Robust) ---
const SynapseLogo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let resizeObserver: ResizeObserver;
    
    interface Particle {
      x: number;
      y: number;
      originX: number;
      originY: number;
      size: number;
      baseAlpha: number;
      phaseOffset: number;
    }
    
    let particles: Particle[] = [];
    const text = "Synapse";
    // Fallback fonts ensure layout doesn't break if Lora fails, but Lora is prioritized
    const fontFamily = 'Lora, serif'; 

    const initParticles = (width: number, height: number) => {
      // Clear previous
      particles = [];
      
      const dpr = window.devicePixelRatio || 1;
      
      // Dynamic font size based on container width
      // Logic: Aim for ~100px font at 600px width. Scale down linearly.
      const calculatedFontSize = Math.min(width * 0.20, 100); 
      const fontSize = Math.max(calculatedFontSize, 40); // Minimum 40px

      // Canvas Setup
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Draw Text for Sampling
      ctx.fillStyle = 'white';
      ctx.font = `500 ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) {
         // Tighter tracking on mobile to prevent overflow
          (ctx as any).letterSpacing = width < 500 ? "-2px" : "-4px"; 
      }
      
      ctx.fillText(text, width / 2, height / 2);

      // Sample Pixels
      const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const gap = width < 500 ? 4 * dpr : 5 * dpr; // Denser on desktop

      for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
          const index = (y * 4 * textCoordinates.width) + (x * 4) + 3;
          // Threshold for pixel sampling
          if (textCoordinates.data[index] > 128) {
             const pX = x / dpr;
             const pY = y / dpr;
             
             particles.push({
               x: pX,
               y: pY,
               originX: pX,
               originY: pY,
               size: Math.random() * 1.5 + 0.5, 
               baseAlpha: Math.random() * 0.3 + 0.4,
               phaseOffset: Math.random() * Math.PI * 2
             });
          }
        }
      }
    };

    const animate = () => {
      // Safety check if canvas dimensions are zero (hidden or init state)
      if (canvas.width === 0 || canvas.height === 0) return;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);
      
      const time = Date.now();
      // Slower wave for more "Zen" feel
      const cycleDuration = 8000; 
      const t = (time % cycleDuration) / cycleDuration;
      
      const startX = -100;
      const endX = width + 100;
      const wavePos = startX + t * (endX - startX);

      particles.forEach(p => {
        // Gentle drift
        const driftX = Math.cos(time * 0.001 + p.phaseOffset) * 0.5;
        const driftY = Math.sin(time * 0.0015 + p.phaseOffset) * 0.5;

        // Wave Effect
        const organicLag = Math.sin(p.originY * 0.05 + time * 0.001) * 30; 
        const distToWave = Math.abs(p.originX - (wavePos + organicLag));
        
        const range = 100;
        let intensity = 0;

        if (distToWave < range) {
            const norm = 1 - (distToWave / range);
            intensity = Math.pow(norm, 3); 
        }

        const currentSize = p.size * (1 + intensity * 1.5); 
        // Color shifts from stone-400 (base) to bright white (active)
        const cVal = Math.floor(180 + (75 * intensity)); 
        const a = Math.min(1, p.baseAlpha + intensity * 0.6);

        p.x = p.originX + driftX;
        p.y = p.originY + driftY;

        ctx.fillStyle = `rgba(${cVal}, ${cVal}, ${cVal}, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Use ResizeObserver for robust layout detection
    resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                // Ensure fonts are ready before initializing particles to avoid measuring empty fonts
                document.fonts.ready.then(() => {
                   initParticles(width, height);
                });
            }
        }
    });

    resizeObserver.observe(container);
    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
        ref={containerRef} 
        className="
            relative w-full max-w-[600px] h-[120px] md:h-[160px] 
            flex items-center justify-center 
            select-none pointer-events-none mb-4 
            transition-all duration-300
        "
    >
       <canvas 
         ref={canvasRef} 
         className="block" // Removed absolute positioning to let it fill container naturally
       />
    </div>
  );
};

// --- Contained Ambient Graph ---
const AmbientGraphWidget = ({ notes, onClick }: { notes: Note[], onClick: () => void }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const displayNotes = notes.length > 0 
        ? notes.slice(0, 20).map(n => ({ ...n, x: Math.random() * width, y: Math.random() * height })) 
        : Array.from({ length: 15 }).map((_, i) => ({ id: `dummy-${i}`, x: Math.random() * width, y: Math.random() * height }));
    
    const links = [];
    for (let i = 0; i < displayNotes.length; i++) {
        const targetIndex = (i + 1) % displayNotes.length;
        links.push({ source: displayNotes[i].id, target: displayNotes[targetIndex].id });
        if (Math.random() > 0.6) {
             const targetIndex2 = Math.floor(Math.random() * displayNotes.length);
             links.push({ source: displayNotes[i].id, target: displayNotes[targetIndex2].id });
        }
    }

    const nodes = displayNotes.map(n => ({ id: n.id, r: 2, ...n }));

    const svg = d3.select(svgRef.current)
        .attr("viewBox", [0, 0, width, height]);
    
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes as any)
        .force("charge", d3.forceManyBody().strength(-20)) 
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(40).strength(0.3)) 
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08)) 
        .velocityDecay(0.18)
        .alphaDecay(0);

    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#78716c") 
        .attr("stroke-opacity", 0.3) 
        .attr("stroke-width", 1);

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", (d: any) => d.r)
        .attr("fill", "#a8a29e") 
        .attr("opacity", 0.8)
        .attr("class", "animate-fade-in");

    simulation.on("tick", () => {
        link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        node
            .attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);
    });

    return () => {
        simulation.stop();
    };
  }, [notes]);

  return (
    <div 
        ref={containerRef}
        onClick={onClick}
        className="
            relative w-64 h-40 
            bg-zen-surface/40 backdrop-blur-md 
            border border-zen-border/20
            rounded-xl overflow-hidden cursor-pointer 
            group transition-all duration-700 hover:bg-zen-surface/60 hover:border-zen-border/40 shadow-glass
        "
    >
        <div className="absolute top-3 left-4 z-10 flex flex-col pointer-events-none">
             <span className="text-[10px] font-mono text-zen-muted uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                Neural Connections
             </span>
        </div>
        <svg ref={svgRef} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-zen-bg/90 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export const SearchPage: React.FC<SearchPageProps> = ({ 
  recentNotes, 
  todaysTasks, 
  notes,
  onNavigateToNote,
  onChangeView,
  onToggleTask
}) => {
  const [query, setQuery] = useState('');
  const [circadianPhase, setCircadianPhase] = useState({ name: '', gradient: '' });
  const [quoteIndex, setQuoteIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    // Pick a random quote on mount
    setQuoteIndex(Math.floor(Math.random() * ZEN_QUOTES.length));

    // Determine Circadian Lighting
    const hour = new Date().getHours();
    let phase = { 
        name: 'Deep Rest', 
        gradient: 'radial-gradient(circle at 50% 100%, rgba(28, 25, 23, 0.4) 0%, transparent 70%)' // Default Night
    };
    
    if (hour >= 5 && hour < 11) {
        // Morning: Cool, pale light from top left (like a window)
        phase = { 
            name: 'Morning Clarity', 
            gradient: 'radial-gradient(circle at 20% 0%, rgba(231, 229, 228, 0.12) 0%, transparent 60%)' 
        }; 
    } else if (hour >= 11 && hour < 17) {
        // Midday: Warm, energetic amber light from overhead
        phase = { 
            name: 'Midday Flow', 
            gradient: 'radial-gradient(circle at 50% -20%, rgba(217, 119, 6, 0.08) 0%, transparent 70%)' 
        }; 
    } else if (hour >= 17 && hour < 21) {
        // Evening: Deep, rich amber light from the horizon (bottom)
        phase = { 
            name: 'Evening Reflection', 
            gradient: 'radial-gradient(circle at 80% 100%, rgba(217, 119, 6, 0.12) 0%, transparent 60%)' 
        }; 
    }
    
    setCircadianPhase(phase);

  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    setQuery('');
  };

  const handleRefreshQuote = () => {
      let nextIndex;
      do {
          nextIndex = Math.floor(Math.random() * ZEN_QUOTES.length);
      } while (nextIndex === quoteIndex && ZEN_QUOTES.length > 1);
      setQuoteIndex(nextIndex);
  };

  const currentQuote = ZEN_QUOTES[quoteIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zen-bg flex flex-col items-center">
      
      {/* --- CIRCADIAN AMBIENT LIGHT LAYER --- */}
      {/* This creates the subtle atmospheric glow based on time of day */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-[3000ms] ease-in-out z-0"
        style={{ background: circadianPhase.gradient }}
      />
      
      {/* --- TOP RIGHT: Tactile Agenda --- */}
      <div className="absolute top-8 right-8 z-20 hidden md:flex flex-col items-end animate-slide-down-fade w-80">
        <div className="w-full flex flex-col items-end">
            <button 
                onClick={() => onChangeView(AppView.AGENDA)}
                className="group flex items-center gap-2 mb-4 px-2 py-1 rounded transition-colors hover:bg-zen-surface/20"
            >
                <span className="text-xs font-mono text-zen-muted group-hover:text-zen-heading uppercase tracking-widest transition-colors">
                    Focus
                </span>
                <Maximize2 size={12} className="text-zen-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <div className="space-y-1 w-full">
                {todaysTasks.slice(0, 3).map(task => (
                    <div 
                        key={task.id} 
                        className="
                            group flex items-center justify-end gap-3 py-2 px-3 rounded-lg
                            cursor-pointer transition-all duration-200
                            hover:bg-zen-surface/10
                        "
                        onClick={() => onToggleTask(task.id)}
                    >
                        <span className={`text-sm font-sans text-right transition-all duration-300 ${task.completed ? 'text-zen-muted line-through decoration-zen-border' : 'text-zen-body font-medium group-hover:text-zen-heading'}`}>
                            {task.content}
                        </span>
                        <button className="flex items-center justify-center text-zen-muted group-hover:text-zen-accent transition-colors shrink-0">
                            {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} strokeWidth={1.5} />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* --- CENTER: The Synapse Portal --- */}
      <div className="z-20 w-full max-w-xl px-6 flex flex-col items-center justify-center min-h-screen pb-24">
         
         {/* Branding / Logo - TIGHTER SPACING (mb-2) */}
         <div className="mb-2 w-full flex justify-center group cursor-default">
            <SynapseLogo />
         </div>

         {/* Capsule Search Bar */}
         <form onSubmit={handleSearch} className="w-full relative group z-30">
            <div className="
                relative flex items-center
                bg-zen-surface/40 backdrop-blur-xl
                rounded-2xl py-4 px-6
                border border-zen-border/20
                shadow-glass
                group-focus-within:bg-zen-surface/60 group-focus-within:border-zen-border/40 group-focus-within:shadow-2xl
                transition-all duration-500 ease-out
            ">
                <Search 
                    size={20} 
                    className="text-zen-muted mr-4 group-focus-within:text-zen-accent transition-colors duration-500" 
                    strokeWidth={2}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What are you looking for?"
                    className="
                        flex-1 bg-transparent 
                        text-lg font-light text-zen-heading placeholder-zen-muted/30 
                        focus:outline-none font-sans
                    "
                />
            </div>
         </form>

         {/* --- RECENT NOTES --- */}
         <div className="mt-6 w-full flex flex-col gap-1 animate-slide-up animation-delay-200">
             {recentNotes.length > 0 && (
                 <div className="px-6 mb-3 text-[10px] font-mono text-zen-muted uppercase tracking-widest opacity-40 select-none flex items-center gap-2">
                     <History size={12} className="stroke-[2px]" />
                     Recent Thoughts
                     <div className="h-[1px] flex-1 bg-zen-border/20 ml-2"></div>
                 </div>
             )}
            {recentNotes.length > 0 && recentNotes.slice(0, 3).map((note) => (
                <button
                    key={note.id}
                    onClick={() => onNavigateToNote(note.id)}
                    className="
                        group w-full flex items-center gap-4 px-6 py-3 rounded-xl
                        hover:bg-zen-surface/20 hover:backdrop-blur-sm
                        transition-all duration-300 ease-out
                        text-left
                    "
                >
                    <NotebookPen size={16} strokeWidth={1.5} className="text-zen-muted/50 group-hover:text-zen-accent transition-colors shrink-0" />
                    <span className="flex-1 text-base font-serif text-zen-muted/80 group-hover:text-zen-heading transition-colors truncate">
                        {note.title || "Untitled Thought"}
                    </span>
                    <ArrowRight size={14} className="text-zen-muted/30 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </button>
            ))}
         </div>

      </div>

      {/* --- BOTTOM RIGHT: Neural Monitor (Graph) --- */}
      <div className="absolute bottom-8 right-8 z-20 animate-fade-in delay-200 hidden md:block">
         <AmbientGraphWidget notes={notes} onClick={() => onChangeView(AppView.GRAPH)} />
      </div>

      {/* --- BOTTOM LEFT: Zen Wisdom (Fixed & Refined) --- */}
      <div className="fixed bottom-8 left-8 z-40 hidden md:block max-w-xs animate-fade-in delay-700 group select-none">
          <div className="relative">
              {/* Decorative Watermark Quote */}
              <span className="absolute -top-4 -left-3 text-6xl font-serif text-zen-surface opacity-50 group-hover:opacity-100 group-hover:text-zen-border/40 transition-all duration-700 select-none pointer-events-none">
                  “
              </span>
              
              {/* Quote Text */}
              <p className="relative z-10 text-lg font-serif text-zen-muted group-hover:text-zen-heading transition-colors duration-700 leading-relaxed drop-shadow-sm">
                  {currentQuote.text}
              </p>
              
              {/* Author & Controls */}
              <div className="mt-3 flex items-center gap-3 pl-1">
                   <div className="h-px w-4 bg-zen-border group-hover:w-8 group-hover:bg-zen-accent transition-all duration-500"></div>
                   
                   <span className="text-[10px] font-mono font-medium text-zen-muted/60 uppercase tracking-widest group-hover:text-zen-muted transition-colors duration-500">
                      {currentQuote.author}
                   </span>
                   
                   <button 
                      onClick={handleRefreshQuote}
                      className="ml-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-zen-surface text-zen-muted hover:text-zen-accent rounded-md transition-all duration-500"
                      title="New Perspective"
                   >
                       <Dices size={12} strokeWidth={1.5} />
                   </button>
              </div>
          </div>
      </div>

    </div>
  );
};

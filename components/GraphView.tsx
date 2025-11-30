import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Note } from '../types';
import { 
  Search, Minus, Plus, Focus, 
  Settings2, Share2, Layers
} from 'lucide-react';

interface GraphViewProps {
  notes: Note[];
  onSelectNote: (noteId: string) => void;
}

// --- Extended types for D3 ---
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  group: number; // 1: Leaf, 2: Bridge, 3: Hub
  connections: number;
  tags: string[];
  zettelType: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string | SimulationNode;
  target: string | SimulationNode;
  value: number; 
  type: 'explicit' | 'semantic';
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, onSelectNote }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // State for Omnibar & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeFilters, setActiveFilters] = useState<{
    orphans: boolean;
    hubsOnly: boolean;
    activeTag: string | null;
  }>({
    orphans: true,
    hubsOnly: false,
    activeTag: null
  });

  // D3 Refs - We keep track of the simulation instance to update it smoothly
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  // We store previous node positions to prevent "teleporting" or disappearing on re-renders
  const nodeStateRef = useRef<Map<string, {x: number, y: number, vx: number, vy: number}>>(new Map());

  // --- Data Preparation ---
  const { nodes, links, uniqueTags } = useMemo(() => {
    const computedLinks: SimulationLink[] = [];
    const linkSet = new Set<string>();
    const tagSet = new Set<string>();

    notes.forEach(note => {
      note.tags.forEach(t => tagSet.add(t));

      // Explicit Connections
      note.connections.forEach(targetId => {
        if (notes.find(n => n.id === targetId)) {
          const linkId = [note.id, targetId].sort().join('-');
          if (!linkSet.has(linkId)) {
             computedLinks.push({ source: note.id, target: targetId, value: 1, type: 'explicit' });
             linkSet.add(linkId);
          }
        }
      });
      
      // Block References
      note.blocks.forEach(block => {
        if (block.type === 'reference' && block.referenceId) {
             const targetId = block.referenceId;
             if (notes.find(n => n.id === targetId)) {
                const linkId = [note.id, targetId].sort().join('-');
                if (!linkSet.has(linkId)) {
                    computedLinks.push({ source: note.id, target: targetId, value: 1.5, type: 'explicit' });
                    linkSet.add(linkId);
                }
             }
        }
      });
    });

    // Node Metadata & State Preservation
    const connectionCounts: {[key: string]: number} = {};
    notes.forEach(n => connectionCounts[n.id] = 0);
    computedLinks.forEach(l => {
        const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
        if(connectionCounts[src] !== undefined) connectionCounts[src]++;
        if(connectionCounts[tgt] !== undefined) connectionCounts[tgt]++;
    });

    const computedNodes: SimulationNode[] = notes.map(n => {
        const count = connectionCounts[n.id] || 0;
        let group = 1; 
        if (count > 2) group = 2; 
        if (count >= 5) group = 3; 

        // Preserve physics state if available to prevent disappearing nodes
        const savedState = nodeStateRef.current.get(n.id);

        return {
            id: n.id,
            title: n.title || "Untitled",
            group,
            connections: count,
            tags: n.tags,
            zettelType: n.zettelType,
            // If we have saved state, use it. Otherwise undefined lets D3 initialize it.
            x: savedState?.x,
            y: savedState?.y,
            vx: savedState?.vx,
            vy: savedState?.vy
        };
    });

    return { 
      nodes: computedNodes, 
      links: computedLinks, 
      uniqueTags: Array.from(tagSet).sort() 
    };
  }, [notes]);

  // Filtered Data based on Omnibar settings
  const { filteredNodes, filteredLinks } = useMemo(() => {
     let fNodes = nodes;
     
     if (!activeFilters.orphans) {
         fNodes = fNodes.filter(n => n.connections > 0);
     }
     if (activeFilters.hubsOnly) {
         fNodes = fNodes.filter(n => n.group === 3);
     }

     const nodeIds = new Set(fNodes.map(n => n.id));
     const fLinks = links.filter(l => {
         const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
         const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
         return nodeIds.has(s) && nodeIds.has(t);
     });

     return { filteredNodes: fNodes, filteredLinks: fLinks };
  }, [nodes, links, activeFilters]);

  // --- D3 Render Effect ---
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    
    // Cleanup previous simulation but NOT the state ref
    if (simulationRef.current) simulationRef.current.stop();
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .style("cursor", "grab");

    // Defs (Glows & Markers)
    const defs = svg.append("defs");
    
    const filter = defs.append("filter").attr("id", "text-halo");
    filter.append("feMorphology").attr("operator", "dilated").attr("radius", "2").attr("in", "SourceAlpha").attr("result", "dilated");
    filter.append("feFlood").attr("flood-color", "#0c0a09").attr("result", "color"); 
    filter.append("feComposite").attr("in", "color").attr("in2", "dilated").attr("operator", "in").attr("result", "outline");
    filter.append("feMerge").selectAll("feMergeNode").data(["outline", "SourceGraphic"]).enter().append("feMergeNode").attr("in", (d) => d);

    const container = svg.append("g");

    // --- PHYSICS CONFIGURATION (The "Jelly" Logic) ---
    // 1. Low alphaDecay: Sim stays active longer (more alive)
    // 2. Low velocityDecay: Low friction, things keep moving (gelatinous)
    // 3. Low link strength: Springy, not rigid connections
    // 4. ForceManyBody: Negative charge to push apart
    
    const simulation = d3.forceSimulation(filteredNodes)
        .force("link", d3.forceLink(filteredLinks)
            .id((d: any) => d.id)
            .distance((d: any) => d.connections > 3 ? 150 : 100) // Longer links
            .strength(0.08) // Very low strength = Rubbery/Springy links
        )
        .force("charge", d3.forceManyBody()
            .strength((d: any) => -250 - (d.connections * 40)) // Strong repulsion
        )
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.03)) // Gentle pull to center
        .force("collide", d3.forceCollide()
            .radius((d: any) => 30 + (d.connections * 2))
            .iterations(2)
            .strength(0.5) // Soft collisions
        )
        .velocityDecay(0.12) // Low friction = "Jelly" / Underwater feel
        .alphaTarget(0); // Settle eventually

    simulationRef.current = simulation;

    // --- Drawing ---

    const link = container.append("g")
        .selectAll("line")
        .data(filteredLinks)
        .join("line")
        .attr("stroke", "#78716c") 
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 1.5)
        .attr("class", "transition-all duration-300");

    const node = container.append("g")
        .selectAll("g")
        .data(filteredNodes)
        .join("g")
        .call(d3.drag<any, any>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    // Node Circle
    node.append("circle")
        .attr("r", (d: any) => {
            const base = 5;
            const size = base + Math.log2(d.connections + 1) * 4;
            return size;
        })
        .attr("fill", (d: any) => d.group === 3 ? "#1c1917" : "#292524")
        .attr("stroke", (d: any) => {
            if (activeFilters.activeTag && d.tags.includes(activeFilters.activeTag)) return "#d97706";
            if (d.group === 3) return "#d97706"; 
            return "#57534e"; 
        })
        .attr("stroke-width", (d: any) => {
             if (activeFilters.activeTag && d.tags.includes(activeFilters.activeTag)) return 3;
             return d.group === 3 ? 2 : 1.5;
        })
        .attr("class", "transition-all duration-300 cursor-pointer hover:fill-zen-surface");

    // Labels
    const label = node.append("text")
        .text((d: any) => d.title)
        .attr("dx", (d: any) => 8 + (d.connections * 1.5))
        .attr("dy", 4)
        .attr("font-family", "'Inter', sans-serif")
        .attr("font-weight", (d: any) => d.group === 3 ? "600" : "400")
        .attr("font-size", (d: any) => d.group === 3 ? "14px" : "11px")
        .attr("fill", (d: any) => d.group === 3 ? "#e7e5e4" : "#a8a29e")
        .style("pointer-events", "none")
        .style("filter", "url(#text-halo)")
        .attr("opacity", (d: any) => {
            // Initial opacity based on default zoom (1)
            if (zoomLevel < 1 && d.group < 2) return 0;
            return 1;
        });

    // --- Tick ---
    simulation.on("tick", () => {
        // Update state ref for persistence on re-render
        filteredNodes.forEach(n => {
            if(n.x && n.y) {
                nodeStateRef.current.set(n.id, { x: n.x, y: n.y, vx: n.vx || 0, vy: n.vy || 0 });
            }
        });

        link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // --- Zoom ---
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4]) 
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
            setZoomLevel(event.transform.k);
            
            // Smoother semantic zoom transition
            label.attr("opacity", (d: any) => {
                 const k = event.transform.k;
                 if (k < 0.6 && d.group < 3) return 0;
                 if (k < 1.2 && d.group < 2) return 0;
                 return 1;
             });
        });

    svg.call(zoom).on("dblclick.zoom", null);
    zoomRef.current = zoom;

    // --- Interactions ---
    function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        svg.style("cursor", "grabbing");
    }

    function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        svg.style("cursor", "grab");
    }

    // Highlight Logic
    node.on("mouseover", (event, d) => {
        // Dim Others
        node.transition().duration(200).attr("opacity", 0.1);
        link.transition().duration(200).attr("opacity", 0.05);
        label.transition().duration(200).attr("opacity", 0);

        // Highlight Target
        const targetSelection = node.filter((n: any) => n.id === d.id);
        targetSelection.transition().duration(200).attr("opacity", 1);
        
        // Find Neighbors
        const neighborIds = new Set<string>();
        link.each((l: any) => {
            if (l.source.id === d.id) neighborIds.add(l.target.id);
            else if (l.target.id === d.id) neighborIds.add(l.source.id);
        });

        // Highlight Links
        link.filter((l: any) => l.source.id === d.id || l.target.id === d.id)
            .transition().duration(200)
            .attr("opacity", 1)
            .attr("stroke", "#d97706") // Accent Color
            .attr("stroke-width", 2);

        // Highlight Neighbors
        node.filter((n: any) => neighborIds.has(n.id))
            .transition().duration(200)
            .attr("opacity", 1);

        label.filter((n: any) => n.id === d.id || neighborIds.has(n.id))
             .transition().duration(200)
             .attr("opacity", 1)
             .attr("font-weight", "bold");
    });

    node.on("mouseout", () => {
        // Restore
        node.transition().duration(300).attr("opacity", 1);
        link.transition().duration(300).attr("opacity", 0.35).attr("stroke", "#78716c").attr("stroke-width", (d:any) => Math.sqrt(d.value) * 1.5);
        
        // Manual restore opacity based on zoom level to ensure they don't stay hidden
        label.transition().duration(300)
             .attr("opacity", (d: any) => {
                 if (zoomLevel < 0.6 && d.group < 3) return 0;
                 if (zoomLevel < 1.2 && d.group < 2) return 0;
                 return 1;
             })
             .attr("font-weight", (d: any) => d.group === 3 ? "600" : "400");
    });

    node.on("click", (e, d) => onSelectNote(d.id));

    return () => { simulation.stop(); };
  }, [filteredNodes, filteredLinks, activeFilters]); 


  // --- Camera Control ---
  const flyToNode = (noteId: string) => {
      // Look in the persistent ref, as the D3 data might be mutated
      const savedNode = nodeStateRef.current.get(noteId);
      
      if (savedNode && svgRef.current && zoomRef.current && wrapperRef.current) {
          const width = wrapperRef.current.clientWidth;
          const height = wrapperRef.current.clientHeight;
          const scale = 2.5;
          const transform = d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(scale)
              .translate(-(savedNode.x || 0), -(savedNode.y || 0));
          
          d3.select(svgRef.current)
            .transition()
            .duration(1500)
            .ease(d3.easeCubicInOut)
            .call(zoomRef.current.transform, transform);
            
          setSearchQuery('');
      }
  };

  const searchResults = searchQuery 
    ? filteredNodes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="relative w-full h-full bg-zen-bg overflow-hidden animate-fade-in font-sans" ref={wrapperRef}>
      
      {/* --- OMNIBAR --- */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md flex flex-col gap-2">
         
         {/* Search Input */}
         <div className="relative group">
            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl 
                bg-zen-surface/60 backdrop-blur-xl border border-zen-border/40 
                shadow-glass transition-all duration-300
                ${searchQuery ? 'ring-1 ring-zen-accent/50' : 'hover:bg-zen-surface/80'}
            `}>
                <Search size={18} className={`transition-colors ${searchQuery ? 'text-zen-accent' : 'text-zen-muted'}`} />
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the constellation..."
                    className="flex-1 bg-transparent text-sm text-zen-heading placeholder-zen-muted/50 focus:outline-none"
                />
                <div className="w-px h-4 bg-zen-border/30 mx-2"></div>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-zen-accent/20 text-zen-accent' : 'text-zen-muted hover:text-zen-heading'}`}
                >
                    <Settings2 size={16} />
                </button>
            </div>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zen-surface/90 backdrop-blur-xl border border-zen-border/50 rounded-xl shadow-2xl overflow-hidden animate-slide-up-fade">
                    {searchResults.map(node => (
                        <button
                            key={node.id}
                            onClick={() => flyToNode(node.id)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zen-bg/50 transition-colors group"
                        >
                            <span className="text-sm text-zen-body group-hover:text-zen-heading">{node.title}</span>
                            {node.group === 3 && <span className="text-[10px] uppercase text-zen-accent/80 font-mono tracking-wider">Hub</span>}
                        </button>
                    ))}
                </div>
            )}
         </div>

         {/* Expanded Settings Panel */}
         {showSettings && (
             <div className="bg-zen-surface/60 backdrop-blur-xl border border-zen-border/40 rounded-xl p-4 shadow-glass animate-slide-down-fade">
                 
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-xs font-bold text-zen-muted uppercase tracking-widest">Filters</span>
                 </div>
                 
                 <div className="flex gap-2 mb-4">
                     <button 
                        onClick={() => setActiveFilters(p => ({ ...p, orphans: !p.orphans }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeFilters.orphans ? 'bg-zen-accent/10 border-zen-accent/30 text-zen-accent' : 'bg-transparent border-zen-border/30 text-zen-muted'}`}
                     >
                        <Layers size={12} /> Show Orphans
                     </button>
                     <button 
                        onClick={() => setActiveFilters(p => ({ ...p, hubsOnly: !p.hubsOnly }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeFilters.hubsOnly ? 'bg-zen-accent/10 border-zen-accent/30 text-zen-accent' : 'bg-transparent border-zen-border/30 text-zen-muted'}`}
                     >
                        <Share2 size={12} /> Hubs Only
                     </button>
                 </div>

                 {uniqueTags.length > 0 && (
                     <>
                        <div className="flex items-center justify-between mb-2 mt-4">
                            <span className="text-xs font-bold text-zen-muted uppercase tracking-widest">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 scrollbar-hide">
                            {uniqueTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setActiveFilters(p => ({ ...p, activeTag: p.activeTag === tag ? null : tag }))}
                                    className={`
                                        px-2 py-0.5 rounded text-[10px] border transition-all
                                        ${activeFilters.activeTag === tag 
                                            ? 'bg-zen-accent text-zen-bg border-zen-accent font-bold' 
                                            : 'bg-zen-bg/50 text-zen-muted border-zen-border/30 hover:border-zen-muted'}
                                    `}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                     </>
                 )}
             </div>
         )}
      </div>

      {/* Main Canvas */}
      <svg ref={svgRef} className="w-full h-full touch-none focus:outline-none"></svg>

      {/* Bottom Controls (Minimal) */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2">
         <button 
            onClick={() => { if(svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.scaleBy, 1.3); }}
            className="p-3 bg-zen-surface/40 backdrop-blur-md border border-zen-border/30 rounded-full text-zen-muted hover:text-zen-heading hover:bg-zen-surface/80 shadow-lg transition-all"
         >
             <Plus size={18} />
         </button>
         <button 
            onClick={() => { if(svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.scaleBy, 0.7); }}
            className="p-3 bg-zen-surface/40 backdrop-blur-md border border-zen-border/30 rounded-full text-zen-muted hover:text-zen-heading hover:bg-zen-surface/80 shadow-lg transition-all"
         >
             <Minus size={18} />
         </button>
         <button 
            onClick={() => { if(svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity); }}
            className="p-3 bg-zen-surface/40 backdrop-blur-md border border-zen-border/30 rounded-full text-zen-muted hover:text-zen-heading hover:bg-zen-surface/80 shadow-lg transition-all mt-2"
            title="Reset View"
         >
             <Focus size={18} />
         </button>
      </div>

      {/* Legend / Info */}
      <div className="absolute bottom-8 left-8 pointer-events-none select-none">
          <div className="flex flex-col gap-1 opacity-40">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1c1917] border border-[#d97706]"></div>
                  <span className="text-[10px] text-zen-muted font-mono uppercase">Hub Node</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#292524] border border-[#57534e]"></div>
                  <span className="text-[10px] text-zen-muted font-mono uppercase">Standard Node</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-[#78716c] opacity-50"></div>
                  <span className="text-[10px] text-zen-muted font-mono uppercase">Connection</span>
              </div>
          </div>
      </div>

    </div>
  );
};
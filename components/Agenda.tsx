import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Subtask } from '../types';
import { 
  Check, Trash2, CalendarClock,
  Sparkles, Circle, Flag,
  ArrowRight, Clock,
  CornerDownLeft, Pause, Play, Battery, BatteryMedium, BatteryLow, Loader2, Hourglass, Zap, CalendarDays, BrainCircuit, AlignLeft, Hash, X, Plus, Command, GripVertical, Move
} from 'lucide-react';
import { breakDownTask, parseSmartTask } from '../services/geminiService';

interface AgendaProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
}

const getStartOfDay = (d: Date) => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate.getTime();
};

const addDays = (timestamp: number, days: number) => {
  const d = new Date(timestamp);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

const calculateFontSize = (text: string) => {
  const len = text.length;
  if (len < 20) return 'text-4xl md:text-5xl lg:text-6xl';
  if (len < 40) return 'text-3xl md:text-4xl lg:text-5xl';
  if (len < 80) return 'text-2xl md:text-3xl';
  return 'text-xl md:text-2xl';
};

interface ParsedTask {
  cleanText: string;
  startDate?: number;
  dueDate?: number;
  priority: 'high' | 'normal';
  recurrence?: string;
  estimatedDuration?: number;
  energyLevel?: 'low' | 'medium' | 'high';
  context?: string;
  metadataFound: boolean;
  rawTags: string[];
}

const parseTaskInputRegex = (input: string): ParsedTask => {
  let text = input;
  let startDate: number | undefined;
  let dueDate: number | undefined;
  let priority: 'high' | 'normal' = 'normal';
  let recurrence: string | undefined;
  let estimatedDuration: number | undefined;
  let energyLevel: 'low' | 'medium' | 'high' | undefined;
  let context: string | undefined;
  let metadataFound = false;
  const rawTags: string[] = [];

  const contextMatch = text.match(/@(\w+)/);
  if (contextMatch) {
      context = contextMatch[1].toLowerCase();
      text = text.replace(contextMatch[0], '');
      rawTags.push(`@${context}`);
      metadataFound = true;
  }

  if (text.match(/!(high|urgent|focus)/i)) {
    priority = 'high';
    text = text.replace(/!(high|urgent|focus)/gi, '');
    rawTags.push('High Priority');
    metadataFound = true;
  }

  const durMatch = text.match(/\b(?:for )?(\d+)(m|min|h|hr|hours?)\b/i);
  if (durMatch) {
      const val = parseInt(durMatch[1]);
      const unit = durMatch[2].toLowerCase();
      estimatedDuration = unit.startsWith('h') ? val * 60 : val;
      text = text.replace(durMatch[0], '');
      rawTags.push(`${estimatedDuration} min`);
      metadataFound = true;
  }

  if (text.match(/#(low|easy)/i)) { 
      energyLevel = 'low'; text = text.replace(/#(low|easy)/i, ''); 
      rawTags.push('Low Energy'); metadataFound = true; 
  }
  else if (text.match(/#(med|medium)/i)) { 
      energyLevel = 'medium'; text = text.replace(/#(med|medium)/i, ''); 
      rawTags.push('Med Energy'); metadataFound = true; 
  }
  else if (text.match(/#(high|hard)/i)) { 
      energyLevel = 'high'; text = text.replace(/#(high|hard)/i, ''); 
      rawTags.push('High Energy'); metadataFound = true; 
  }

  const today = getStartOfDay(new Date());
  
  if (text.match(/\b(tomorrow|tmrw)\b/i)) {
      startDate = addDays(today, 1);
      text = text.replace(/\b(tomorrow|tmrw)\b/i, '');
      rawTags.push('Tomorrow');
      metadataFound = true;
  } else if (text.match(/\b(today)\b/i)) {
      startDate = today;
      text = text.replace(/\b(today)\b/i, '');
      rawTags.push('Today');
      metadataFound = true;
  }

  return {
    cleanText: text.replace(/\s+/g, ' ').trim(),
    startDate,
    dueDate,
    priority,
    recurrence,
    estimatedDuration,
    energyLevel,
    context,
    metadataFound,
    rawTags
  };
};

const SmartInput = ({ 
    onAdd, 
    onSmartAdd 
}: { 
    onAdd: (parsed: ParsedTask) => void,
    onSmartAdd: (text: string) => void
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const parsedRegex = useMemo(() => parseTaskInputRegex(inputValue), [inputValue]);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!inputValue.trim()) return;

            if (e.metaKey || e.ctrlKey) {
                setIsAIProcessing(true);
                await onSmartAdd(inputValue);
                setIsAIProcessing(false);
                setInputValue('');
            } else {
                onAdd(parsedRegex);
                setInputValue('');
            }
        }
        if (e.key === 'Escape') {
            inputRef.current?.blur();
        }
    };

    return (
        <div className="w-full relative group">
            <div className="flex items-center gap-3">
                <div className={`transition-all duration-700 ease-fluid flex items-center justify-center ${isFocused || isAIProcessing ? 'text-zen-accent' : 'text-zen-muted/30'}`}>
                    {isAIProcessing ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Plus size={18} strokeWidth={1.5} />
                    )}
                </div>
                
                <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Capture a task..."
                    className="
                        w-full bg-transparent py-2
                        text-lg font-serif text-zen-heading 
                        placeholder:text-zen-muted/20 placeholder:font-sans placeholder:tracking-wide
                        focus:outline-none transition-colors duration-500
                    "
                    autoComplete="off"
                />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-zen-border/20 pointer-events-none" />
            <div 
                className={`absolute bottom-0 left-0 h-[1px] bg-zen-accent transition-all duration-[800ms] ease-fluid pointer-events-none ${isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}`} 
            />

            <div className={`
                absolute top-full left-0 mt-3 ml-7 w-full z-20 pointer-events-none
                transition-all duration-500 ease-fluid
                ${isFocused && inputValue ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
            `}>
                <div className="flex items-center gap-2">
                    {parsedRegex.rawTags.length > 0 ? (
                        parsedRegex.rawTags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-medium text-zen-accent/90 bg-zen-surface/80 px-2 py-0.5 rounded border border-zen-accent/10 backdrop-blur-md shadow-sm animate-scale-in">
                                {tag}
                            </span>
                        ))
                    ) : (
                         <div className="flex items-center gap-3 text-[10px] text-zen-muted/40 font-mono tracking-wide">
                            <span className="flex items-center gap-1"><span className="border border-zen-border/30 rounded px-1">↵</span> save</span>
                            <span className="flex items-center gap-1"><span className="border border-zen-border/30 rounded px-1">⌘ ↵</span> AI parse</span>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const VisualTimer = ({ task, onUpdate }: { task: Task, onUpdate: (t: Partial<Task>) => void }) => {
    useEffect(() => {
        let interval: any;
        if (task.isTimerRunning) {
            interval = setInterval(() => {
                onUpdate({ actualDuration: (task.actualDuration || 0) + 1 });
            }, 60000); 
        }
        return () => clearInterval(interval);
    }, [task.isTimerRunning, task.actualDuration, onUpdate]);

    const estimated = task.estimatedDuration || 25; 
    const actual = task.actualDuration || 0;
    const progress = Math.min(100, (actual / estimated) * 100);
    const isOverTime = actual > estimated;

    return (
        <div className="w-full transition-all duration-500 ease-fluid">
            <div className="flex items-center justify-between mb-3">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate({ isTimerRunning: !task.isTimerRunning }); }}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500 ease-fluid
                        ${task.isTimerRunning 
                            ? 'bg-zen-accent text-white shadow-glow scale-105' 
                            : 'bg-zen-surface hover:bg-zen-heading hover:text-zen-bg text-zen-muted border border-zen-border/30'}
                    `}
                 >
                    {task.isTimerRunning ? <><Pause size={12} fill="currentColor" /> Focusing</> : <><Play size={12} fill="currentColor" /> Start Timer</>}
                 </button>
                 <div className="flex items-baseline gap-1 opacity-70">
                     <span className={`font-mono text-lg leading-none transition-colors duration-500 ${isOverTime ? 'text-red-400' : 'text-zen-heading'}`}>{actual}m</span>
                     <span className="text-zen-muted text-xs font-mono">/ {estimated}m</span>
                 </div>
            </div>
            
            <div className="h-1.5 w-full bg-zen-surface rounded-full overflow-hidden relative">
                <div 
                    className={`h-full rounded-full transition-all duration-[2000ms] ease-linear ${isOverTime ? 'bg-red-500' : 'bg-zen-accent'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

const EnergyBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
    if (level === 'low') return <span className="text-[9px] text-emerald-400/60 uppercase tracking-wider flex items-center gap-1"><BatteryLow size={9}/> Low Energy</span>;
    if (level === 'medium') return <span className="text-[9px] text-amber-400/60 uppercase tracking-wider flex items-center gap-1"><BatteryMedium size={9}/> Med Energy</span>;
    return <span className="text-[9px] text-rose-400/60 uppercase tracking-wider flex items-center gap-1"><Battery size={9}/> High Energy</span>;
};

const FocusTaskCard = ({ task, onUpdate, onDelete }: { task: Task, onUpdate: (t: Partial<Task>) => void, onDelete: () => void }) => {
    const [isBreakingDown, setIsBreakingDown] = useState(false);

    const handleBreakDown = async () => {
        setIsBreakingDown(true);
        const subtasks = await breakDownTask(task.content);
        onUpdate({ subtasks });
        setIsBreakingDown(false);
    };
    
    const toggleSubtask = (subId: string) => {
        const newSub = task.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        onUpdate({ subtasks: newSub });
    };

    const remainingSubtasks = task.subtasks?.filter(s => !s.completed).length || 0;
    const progress = task.subtasks && task.subtasks.length > 0 
        ? Math.round(((task.subtasks.length - remainingSubtasks) / task.subtasks.length) * 100)
        : 0;

    const fontSizeClass = calculateFontSize(task.content);

    return (
        <div className="
            relative h-full flex flex-col
            bg-zen-surface/10 backdrop-blur-xl border border-zen-border/30 rounded-[32px] 
            shadow-2xl shadow-black/20 overflow-hidden
            group transition-all duration-[800ms] ease-fluid hover:border-zen-border/50
        ">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-zen-surface/20 to-transparent pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />

            <div className="relative z-10 flex justify-between items-start p-8 md:p-10 pb-0">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zen-accent border border-zen-accent/20 bg-zen-accent/5 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold shadow-glow">
                        Current Focus
                    </span>
                    {task.context && <span className="text-[10px] text-zen-muted uppercase tracking-wider bg-zen-surface/50 px-2.5 py-1 rounded-full">@{task.context}</span>}
                 </div>
                 
                 <div className="flex gap-2">
                     <button onClick={onDelete} className="p-2.5 rounded-full text-zen-muted/50 hover:text-red-400 hover:bg-red-900/10 transition-all duration-300 ease-fluid" title="Discard">
                         <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => onUpdate({ completed: true, completedAt: Date.now() })} 
                        className="
                            pl-4 pr-5 py-2.5 rounded-full 
                            bg-zen-heading text-zen-bg hover:bg-zen-accent hover:text-white hover:scale-105 hover:shadow-glow
                            flex items-center gap-2 transition-all duration-500 ease-fluid
                        "
                    >
                         <Check size={16} strokeWidth={3} />
                         <span className="text-xs font-bold uppercase tracking-wider">Complete</span>
                    </button>
                 </div>
            </div>

            <div className="relative z-10 flex-1 px-8 md:px-10 flex items-center">
                <div className="w-full">
                    <h3 className={`
                        font-serif text-zen-heading leading-tight tracking-tight mb-6 animate-enter-slow break-words
                        ${fontSizeClass}
                    `}>
                        {task.content}
                    </h3>
                    
                    <div className="max-w-md animate-enter-slow delay-100">
                        <VisualTimer task={task} onUpdate={onUpdate} />
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 bg-black/20 border-t border-zen-border/10 p-8 md:p-10 transition-all duration-700">
                <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xs font-mono text-zen-muted uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit size={14} className="text-zen-accent opacity-70"/>
                        Step-by-Step Breakdown
                        {task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-zen-muted/50 ml-2">{progress}% Done</span>
                        )}
                        </h4>
                        
                        {(!task.subtasks || task.subtasks.length === 0) && (
                            <button 
                                onClick={handleBreakDown}
                                disabled={isBreakingDown}
                                className="text-xs text-zen-accent hover:text-white transition-all duration-300 flex items-center gap-2 bg-zen-accent/10 hover:bg-zen-accent px-3 py-1.5 rounded-lg"
                            >
                                {isBreakingDown ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                                {isBreakingDown ? 'Thinking...' : 'Generate Steps'}
                            </button>
                        )}
                </div>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
                    {(!task.subtasks || task.subtasks.length === 0) ? (
                        <div className="text-sm text-zen-muted/30 italic font-serif animate-fade-in">
                            AI can break this large task into small, manageable steps for you.
                        </div>
                    ) : (
                        task.subtasks.map((sub, i) => (
                            <div 
                                key={sub.id} 
                                className={`
                                    group/sub flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ease-fluid cursor-pointer select-none
                                    animate-enter-fast
                                    ${sub.completed ? 'bg-transparent opacity-40' : 'bg-zen-surface/40 hover:bg-zen-surface/70 hover:translate-x-1'}
                                `}
                                style={{ animationDelay: `${i * 50}ms` }}
                                onClick={() => toggleSubtask(sub.id)}
                            >
                                <div className={`
                                    w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300
                                    ${sub.completed ? 'bg-zen-muted border-zen-muted' : 'border-zen-muted/50 group-hover/sub:border-zen-accent group-hover/sub:bg-zen-accent/10'}
                                `}>
                                    {sub.completed && <Check size={12} className="text-zen-bg" />}
                                </div>
                                <span className={`text-sm transition-colors duration-300 ${sub.completed ? 'line-through text-zen-muted' : 'text-zen-body group-hover/sub:text-zen-heading'}`}>
                                    {sub.content}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

interface PlanItemProps {
    task: Task;
    onUpdate: (t: Partial<Task>) => void;
    onDelete: () => void;
    onFocus?: () => void;
    projectedEnd?: string;
    index: number;
    isDragging: boolean;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
}

const PlanItem: React.FC<PlanItemProps> = ({ 
    task, 
    onUpdate, 
    onDelete, 
    onFocus,
    projectedEnd,
    index,
    isDragging,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragOver={(e) => onDragOver(e, task.id)}
            onDrop={(e) => onDrop(e, task.id)}
            className={`
                group relative flex items-start gap-4 py-4 px-4 rounded-xl 
                hover:bg-zen-surface/40 border border-transparent 
                transition-all duration-500 ease-fluid cursor-default
                animate-enter-fast
                ${isDragging ? 'opacity-30 scale-95 border-zen-border/50 bg-zen-surface/20' : 'opacity-100 hover:border-zen-border/30'}
            `}
            style={{ animationDelay: `${(index || 0) * 50}ms` }}
        >
            <div 
                className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-zen-muted/20 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:text-zen-muted transition-all duration-200 z-10"
                title="Drag to reorder"
            >
                <GripVertical size={16} />
            </div>

            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    onUpdate({ completed: !task.completed, completedAt: Date.now() }); 
                }}
                className={`
                    mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300 ease-snappy shrink-0 z-20 relative
                    ${task.completed ? 'bg-zen-muted border-zen-muted' : 'border-zen-border/60 hover:border-zen-heading hover:scale-110 hover:bg-zen-surface/50'}
                `}
            >
                {task.completed && <Check size={14} className="text-zen-bg" strokeWidth={3} />}
            </button>
            
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5" onClick={onFocus}>
                <div className="flex items-start justify-between gap-4">
                    <span 
                        className={`
                            text-sm font-medium leading-relaxed transition-colors duration-300 cursor-pointer 
                            line-clamp-2 break-words
                            ${task.completed ? 'text-zen-muted line-through decoration-zen-border/50' : 'text-zen-body group-hover:text-zen-heading'}
                        `}
                        title={task.content.length > 80 ? task.content : undefined}
                    >
                        {task.content}
                    </span>
                </div>
                
                <div className="flex items-center gap-3 h-4">
                     {task.energyLevel && <EnergyBadge level={task.energyLevel} />}
                     
                     <span className="text-[10px] text-zen-muted/50 font-mono flex items-center gap-1">
                        <Clock size={10} /> {task.estimatedDuration || 15}m
                     </span>
                     
                     {projectedEnd && (
                        <span className="text-[10px] font-mono text-zen-muted/30 group-hover:text-zen-muted/60 transition-colors duration-300">
                            → {projectedEnd}
                        </span>
                    )}
                </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-300 ease-fluid translate-x-2 group-hover:translate-x-0 self-center">
                 {onFocus && (
                     <button onClick={(e) => { e.stopPropagation(); onFocus(); }} className="p-2 rounded-lg hover:bg-zen-bg text-zen-muted hover:text-zen-accent transition-colors duration-300" title="Start Focus">
                        <Zap size={14} fill="currentColor" />
                     </button>
                 )}
                 <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg hover:bg-zen-bg text-zen-muted hover:text-red-400 transition-colors duration-300" title="Delete">
                    <Trash2 size={14} />
                 </button>
            </div>
        </div>
    );
};

const SegmentedCapacity = ({ tasks }: { tasks: Task[] }) => {
    const BLOCK_SIZE = 30;
    const MAX_BLOCKS = 12;

    const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimatedDuration || 15), 0);
    const blocksUsed = Math.ceil(totalMinutes / BLOCK_SIZE);
    
    const now = new Date();
    const finishTime = new Date(now.getTime() + totalMinutes * 60000);
    const finishString = finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-mono text-zen-muted uppercase tracking-widest flex items-center gap-2">
                    <Battery size={12} /> Energy Capacity
                </span>
                <span className="text-[10px] font-mono text-zen-muted opacity-60">
                    ~{Math.round(totalMinutes/60*10)/10}h Load • Free by {finishString}
                </span>
            </div>
            
            <div className="flex gap-1 h-2 w-full">
                {Array.from({ length: MAX_BLOCKS }).map((_, i) => {
                    const isFilled = i < blocksUsed;
                    const isOverLimit = i >= MAX_BLOCKS;
                    
                    let bgColor = 'bg-zen-surface';
                    if (isFilled) {
                        if (i < 8) bgColor = 'bg-zen-muted';
                        else if (i < 10) bgColor = 'bg-amber-600/60';
                        else bgColor = 'bg-rose-600/60';
                    }

                    return (
                        <div 
                            key={i} 
                            className={`flex-1 rounded-full transition-all duration-500 ${bgColor}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export const Agenda: React.FC<AgendaProps> = ({ tasks, onUpdateTasks }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const todayStart = getStartOfDay(new Date());

  const activeTasks = tasks.filter(t => !t.completed);
  
  const focusCandidate = activeTasks.find(t => t.isTimerRunning) 
                      || activeTasks.find(t => t.priority === 'high' && (!t.startDate || t.startDate <= todayStart))
                      || null;
  
  const todayTasks = activeTasks.filter(t => {
      if (t.id === focusCandidate?.id) return false; 
      if (t.startDate && t.startDate > todayStart) return false; 
      return true;
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  const upcomingTasks = activeTasks.filter(t => t.startDate && t.startDate > todayStart)
      .sort((a,b) => (a.startDate || 0) - (b.startDate || 0));

  const isFocusMode = !!focusCandidate?.isTimerRunning;

  const handleSmartAdd = async (text: string) => {
      const smartData = await parseSmartTask(text);
      
      const today = getStartOfDay(new Date());
      const targetDate = addDays(today, smartData.daysFromNow);

      const newTask: Task = {
          id: `task-${Date.now()}`,
          content: smartData.title,
          completed: false,
          priority: smartData.priority,
          startDate: targetDate,
          energyLevel: smartData.energyLevel,
          context: smartData.context || undefined,
          estimatedDuration: smartData.estimatedDuration,
          order: Date.now()
      };

      onUpdateTasks([...tasks, newTask]);
  };

  const handleQuickAdd = (parsed: ParsedTask) => {
    if (!parsed.cleanText) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      content: parsed.cleanText,
      completed: false,
      priority: parsed.priority,
      startDate: parsed.startDate || todayStart, 
      dueDate: parsed.dueDate,
      recurrence: parsed.recurrence,
      estimatedDuration: parsed.estimatedDuration || 15,
      energyLevel: parsed.energyLevel,
      context: parsed.context,
      order: Date.now()
    };

    onUpdateTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
      onUpdateTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDelete = (id: string) => onUpdateTasks(tasks.filter(t => t.id !== id));

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedTaskId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedTaskId || draggedTaskId === targetId) return;

      const sourceIndex = tasks.findIndex(t => t.id === draggedTaskId);
      const targetIndex = tasks.findIndex(t => t.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(targetIndex, 0, movedTask);

      const reordered = newTasks.map((t, index) => ({ ...t, order: index }));
      
      onUpdateTasks(reordered);
      setDraggedTaskId(null);
  };


  const handleClearDay = () => {
      if (!confirm("Move all remaining tasks to tomorrow?")) return;
      const tomorrow = addDays(todayStart, 1);
      const updatedTasks = tasks.map(t => {
          if (!t.completed && (!t.startDate || t.startDate <= todayStart)) {
              if (t.priority === 'high' || t.isTimerRunning) return t; 
              return { ...t, startDate: tomorrow };
          }
          return t;
      });
      onUpdateTasks(updatedTasks);
  };

  const getProjectedTimes = () => {
      const now = new Date();
      let accumulatedTime = now.getTime();
      if (focusCandidate) {
          accumulatedTime += (focusCandidate.estimatedDuration || 15) * 60000;
      }
      return todayTasks.map(t => {
          accumulatedTime += (t.estimatedDuration || 15) * 60000;
          return {
              id: t.id,
              endTime: new Date(accumulatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
      });
  };
  const projectedTimes = getProjectedTimes();

  return (
    <div className="h-full flex flex-col animate-enter-slow bg-zen-bg overflow-hidden relative font-sans text-zen-body">
      
      <header className={`
          px-8 pt-12 pb-8 shrink-0 z-20 transition-all duration-[1200ms] ease-fluid max-w-7xl mx-auto w-full
          ${isFocusMode ? 'opacity-10 hover:opacity-100 blur-[2px] hover:blur-none' : 'opacity-100'}
      `}>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
             
             <div className="lg:col-span-5 flex items-baseline gap-4 border-b border-transparent pb-1">
                <h1 className="text-4xl font-serif text-zen-heading tracking-tight shrink-0">
                    Agenda
                </h1>
                <span className="text-sm font-mono text-zen-muted uppercase tracking-widest opacity-60">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
             </div>

             <div className="lg:col-span-7">
                 <SmartInput onAdd={handleQuickAdd} onSmartAdd={handleSmartAdd} />
             </div>

         </div>
      </header>

      <div className="flex-1 overflow-hidden px-8 pb-8">
          <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <div className={`
                  lg:col-span-5 flex flex-col gap-8 overflow-hidden h-full pt-4 transition-all duration-[1200ms] ease-fluid
                  ${isFocusMode ? 'opacity-10 blur-[1px] grayscale hover:opacity-100 hover:blur-none hover:grayscale-0' : 'opacity-100'}
              `}>
                  
                  <div className="shrink-0 flex flex-col gap-6">
                      <SegmentedCapacity tasks={[...todayTasks, ...(focusCandidate ? [focusCandidate] : [])]} />
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-4 mb-4 shrink-0 pb-2">
                          <button 
                            onClick={() => setActiveTab('today')}
                            className={`
                                text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-300 ease-fluid
                                ${activeTab === 'today' ? 'bg-zen-surface text-zen-heading shadow-sm' : 'text-zen-muted hover:bg-zen-surface/30'}
                            `}
                          >
                              Today
                              <span className="ml-2 opacity-50">{todayTasks.length}</span>
                          </button>
                          <button 
                            onClick={() => setActiveTab('upcoming')}
                            className={`
                                text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-300 ease-fluid
                                ${activeTab === 'upcoming' ? 'bg-zen-surface text-zen-heading shadow-sm' : 'text-zen-muted hover:bg-zen-surface/30'}
                            `}
                          >
                              Upcoming
                              <span className="ml-2 opacity-50">{upcomingTasks.length}</span>
                          </button>
                          
                          <div className="flex-1" />
                          {activeTab === 'today' && todayTasks.length > 0 && (
                            <button onClick={handleClearDay} className="text-[10px] text-zen-muted hover:text-zen-heading transition-colors" title="Defer all to tomorrow">
                                Clear
                            </button>
                          )}
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide pb-20">
                          {activeTab === 'today' ? (
                              <>
                                {todayTasks.length === 0 && !focusCandidate && (
                                    <div className="flex flex-col items-center justify-center h-48 text-zen-muted opacity-40 animate-enter-slow border border-dashed border-zen-border/30 rounded-2xl bg-zen-surface/5">
                                        <CalendarDays size={28} strokeWidth={1} className="mb-3"/>
                                        <span className="text-sm font-serif italic mb-1">Your day is clear.</span>
                                        <span className="text-[10px] font-mono uppercase tracking-widest">Add a task to begin</span>
                                    </div>
                                )}
                                {todayTasks.map((task, idx) => (
                                    <PlanItem 
                                        key={task.id} 
                                        task={task} 
                                        index={idx}
                                        onUpdate={(u) => updateTask(task.id, u)}
                                        onDelete={() => handleDelete(task.id)}
                                        onFocus={() => updateTask(task.id, { priority: 'high' })}
                                        projectedEnd={projectedTimes.find(pt => pt.id === task.id)?.endTime}
                                        isDragging={draggedTaskId === task.id}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    />
                                ))}
                              </>
                          ) : (
                              <>
                                {upcomingTasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-48 text-zen-muted opacity-40 animate-enter-slow border border-dashed border-zen-border/30 rounded-2xl bg-zen-surface/5 p-6 text-center">
                                        <CalendarClock size={28} strokeWidth={1} className="mb-3 opacity-60"/>
                                        <span className="text-sm font-serif italic mb-2">No upcoming tasks.</span>
                                        <span className="text-[10px] font-mono uppercase tracking-widest leading-relaxed max-w-[200px]">
                                            Use natural language like "Meeting next Friday" to schedule ahead.
                                        </span>
                                    </div>
                                )}
                                {upcomingTasks.map((task, idx) => (
                                    <PlanItem 
                                        key={task.id} 
                                        task={task} 
                                        index={idx}
                                        onUpdate={(u) => updateTask(task.id, u)}
                                        onDelete={() => handleDelete(task.id)}
                                        isDragging={draggedTaskId === task.id}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    />
                                ))}
                              </>
                          )}
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-7 flex flex-col h-full overflow-hidden pb-6">
                  
                  {focusCandidate ? (
                      <div className="h-full animate-enter-slow">
                          <FocusTaskCard 
                              task={focusCandidate} 
                              onUpdate={(u) => {
                                  if (u.completed) {
                                      updateTask(focusCandidate.id, { ...u, completedAt: Date.now() });
                                  } else {
                                      updateTask(focusCandidate.id, u);
                                  }
                              }}
                              onDelete={() => handleDelete(focusCandidate.id)}
                          />
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center rounded-[32px] border border-dashed border-zen-border/20 bg-zen-surface/5 text-center p-8 animate-enter-slow">
                          <Hourglass size={64} className="text-zen-muted/20 mb-6" strokeWidth={0.5} />
                          <h3 className="text-3xl font-serif text-zen-heading mb-3 opacity-60">Ready to Focus</h3>
                          <p className="text-sm text-zen-muted/50 mb-8 max-w-xs leading-relaxed">
                              Drag tasks here or click the <Zap size={10} className="inline"/> icon to enter Deep Work mode.
                          </p>
                          
                          {todayTasks.length > 0 && (
                              <button 
                                onClick={() => updateTask(todayTasks[0].id, { priority: 'high' })}
                                className="
                                    px-8 py-4 bg-zen-surface hover:bg-zen-accent hover:text-white 
                                    border border-zen-border/50 rounded-full transition-all duration-500 ease-fluid
                                    text-sm font-bold tracking-wide flex items-center gap-3 group shadow-lg hover:shadow-glow
                                "
                              >
                                  <Zap size={16} className="text-zen-accent group-hover:text-white transition-colors" fill="currentColor"/>
                                  Start: <span className="truncate max-w-[200px] opacity-90">{todayTasks[0].content}</span>
                              </button>
                          )}
                      </div>
                  )}
              </div>

          </div>
      </div>
    </div>
  );
};
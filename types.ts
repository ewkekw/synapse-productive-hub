import * as d3 from 'd3';

export interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'blockquote' | 'image' | 'list-item' | 'task' | 'divider' | 'reference';
  content: string;
  checked?: boolean;
  referenceId?: string;
}

export type ZettelType = 'fleeting' | 'permanent' | 'structure';

export interface Note {
  id: string;
  title: string;
  blocks: Block[];
  tags: string[];
  zettelType: ZettelType;
  createdAt: number;
  updatedAt: number;
  connections: string[];
}

export interface Subtask {
  id: string;
  content: string;
  completed: boolean;
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  startDate?: number;
  dueDate?: number;
  completedAt?: number;
  priority?: 'high' | 'normal';
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'weekday' | string;
  energyLevel?: 'low' | 'medium' | 'high';
  context?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  subtasks?: Subtask[];
  isTimerRunning?: boolean;
  order?: number;
}

export enum AppView {
  SEARCH = 'SEARCH',
  EDITOR = 'EDITOR',
  GRAPH = 'GRAPH',
  AGENDA = 'AGENDA',
  SETTINGS = 'SETTINGS'
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  group?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value?: number;
}
import { Note, Task, Block } from './types';

export const DEFAULT_NOTE_ID = 'welcome-note';

export const INITIAL_BLOCKS: Block[] = [
  { id: 'b1', type: 'heading', content: 'Welcome to Synapse' },
  { id: 'b2', type: 'paragraph', content: 'Synapse is your new workspace designed for clarity and focus.' },
  { id: 'b3', type: 'blockquote', content: '"The mind is for having ideas, not holding them." - David Allen' },
  { id: 'b4', type: 'paragraph', content: 'Start typing here. Use the buttons below to add blocks. Switch to Graph View to see how your ideas connect.' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: DEFAULT_NOTE_ID,
    title: 'Welcome to Synapse',
    blocks: INITIAL_BLOCKS,
    tags: ['guide', 'zen'],
    zettelType: 'structure',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    connections: []
  },
  {
    id: 'note-2',
    title: 'Methodology',
    blocks: [
      { id: 'z1', type: 'heading', content: 'Atomic Notes' },
      { id: 'z2', type: 'paragraph', content: 'Each note should contain a single idea. Notes are linked together to form a web of knowledge.' }
    ],
    tags: ['productivity', 'system'],
    zettelType: 'permanent',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now(),
    connections: [DEFAULT_NOTE_ID]
  }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', content: 'Review project goals', completed: false, dueDate: Date.now() },
  { id: 't2', content: 'Focus session', completed: true, dueDate: Date.now() },
];
export interface SubjectImage {
  id: string;
  originalUrl: string;
  processedUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: {
    addHat: boolean;
    hatType: string;
    removeBackground: boolean;
  };
}

export interface AppSettings {
  paperSize: '24x36' | '30x40' | '36x48'; // Inches
  density: 'sparse' | 'medium' | 'dense';
  layout: 'scatter' | 'grid' | 'diagonal';
  patternPrompt: string;
}

export type ProcessingStatus = 'idle' | 'generating_pattern' | 'processing_subjects' | 'ready';

export const HAT_TYPES = [
  'Santa Hat',
  'Elf Hat',
  'Reindeer Antlers',
  'Winter Beanie',
  'Top Hat'
];

export const LAYOUTS = [
  { id: 'scatter', label: 'Random Scatter' },
  { id: 'grid', label: 'Neat Grid' },
  { id: 'diagonal', label: 'Diagonal Flow' }
];

export const SIZES = [
  { id: '24x36', label: 'Small Roll (24" x 36")' },
  { id: '30x40', label: 'Medium Roll (30" x 40")' },
  { id: '36x48', label: 'Large Roll (36" x 48")' }
];

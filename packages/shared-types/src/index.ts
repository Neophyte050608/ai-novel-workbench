export type GenerationSseEvent =
  | { type: 'started'; taskId: string }
  | { type: 'context_ready'; contextSnapshotId: string }
  | { type: 'delta'; content: string }
  | { type: 'message'; message: string }
  | { type: 'done'; resultId: string }
  | { type: 'error'; code: string; message: string };

export interface ProjectSummary {
  id: string;
  title: string;
  genre?: string | null;
  summary?: string | null;
  writingStyle?: string | null;
}

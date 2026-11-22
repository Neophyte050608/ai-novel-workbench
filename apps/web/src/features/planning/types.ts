export interface Volume {
  id: string;
  projectId: string;
  title: string;
  summary?: string | null;
  goal?: string | null;
  status?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ChapterPlan {
  id: string;
  projectId: string;
  volumeId?: string | null;
  chapterId?: string | null;
  title?: string | null;
  goal?: string | null;
  outline?: string | null;
  pov?: string | null;
  constraints?: unknown;
  orderIndex: number;
  status: string;
  canonStatus: string;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type VolumeInput = Partial<Pick<Volume, 'title' | 'summary' | 'goal' | 'status' | 'orderIndex'>> & { title?: string };
export type ChapterPlanInput = Partial<Pick<ChapterPlan, 'volumeId' | 'title' | 'goal' | 'outline' | 'pov' | 'constraints' | 'orderIndex' | 'status' | 'sourceType' | 'sourceId'>> & { chapterId?: string | null };

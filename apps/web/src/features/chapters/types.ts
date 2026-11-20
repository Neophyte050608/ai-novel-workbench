export interface Chapter {
  id: string;
  projectId: string;
  volumeId?: string | null;
  title: string;
  plannedTitle?: string | null;
  goal?: string | null;
  orderIndex: number;
  summary?: string | null;
  status: string;
  currentVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ChapterInput = Partial<Pick<Chapter, 'title' | 'plannedTitle' | 'goal' | 'orderIndex' | 'status' | 'volumeId'>> & { title?: string };

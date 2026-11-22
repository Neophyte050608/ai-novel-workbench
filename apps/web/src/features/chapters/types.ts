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

export interface ChapterVersion {
  id: string;
  chapterId: string;
  generationTaskId?: string | null;
  source: 'user' | 'ai' | 'imported' | string;
  content: string;
  changeSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterSummary {
  id: string;
  projectId: string;
  chapterId: string;
  chapterVersionId?: string | null;
  summary: string;
  keyEvents?: unknown;
  characterChanges?: unknown;
  newFacts?: unknown;
  canonStatus: 'draft' | 'confirmed' | 'archived' | string;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ChapterProfile {
  chapter: Chapter;
  currentVersion?: ChapterVersion | null;
  versions: ChapterVersion[];
  scenes: Array<{ id: string; title?: string | null; orderIndex: number; currentVersionId?: string | null }>;
  summaries: ChapterSummary[];
  latestSummary?: ChapterSummary | null;
  currentSummary?: ChapterSummary | null;
  stats: {
    currentWordCount: number;
    versionCount: number;
    sceneCount: number;
    summaryCount: number;
  };
  readiness: {
    hasCurrentVersion: boolean;
    canAssembleFromScenes: boolean;
  };
}

export type ChapterInput = Partial<Pick<Chapter, 'title' | 'plannedTitle' | 'goal' | 'orderIndex' | 'status' | 'volumeId'>> & { title?: string };

export interface ChapterVersionInput {
  source?: 'user' | 'ai' | 'imported' | string;
  content?: string;
  changeSummary?: string | null;
}

export interface ChapterSummaryInput {
  chapterVersionId?: string | null;
  summary?: string;
  keyEvents?: unknown;
  characterChanges?: unknown;
  newFacts?: unknown;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface AssembleChapterInput {
  includeSceneTitles?: boolean;
  activate?: boolean;
  changeSummary?: string;
}

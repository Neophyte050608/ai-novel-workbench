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

export interface ChapterProfile {
  chapter: Chapter;
  currentVersion?: ChapterVersion | null;
  versions: ChapterVersion[];
  scenes: Array<{ id: string; title?: string | null; orderIndex: number; currentVersionId?: string | null }>;
  stats: {
    currentWordCount: number;
    versionCount: number;
    sceneCount: number;
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

export interface AssembleChapterInput {
  includeSceneTitles?: boolean;
  activate?: boolean;
  changeSummary?: string;
}

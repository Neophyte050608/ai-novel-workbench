export interface Scene {
  id: string;
  projectId: string;
  chapterId: string;
  title?: string | null;
  goal?: string | null;
  orderIndex: number;
  status: string;
  storyTimeLabel?: string | null;
  povCharacterId?: string | null;
  primaryLocationId?: string | null;
  currentPlanId?: string | null;
  currentVersionId?: string | null;
  canonStatus?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SceneInput = Partial<Pick<Scene, 'title' | 'goal' | 'orderIndex' | 'status' | 'storyTimeLabel' | 'povCharacterId' | 'primaryLocationId' | 'sourceType' | 'sourceId'>>;

export interface ScenePlan {
  id: string;
  projectId: string;
  chapterId: string;
  sceneId: string;
  chapterPlanId?: string | null;
  title?: string | null;
  goal?: string | null;
  outline?: string | null;
  conflict?: string | null;
  choice?: string | null;
  consequence?: string | null;
  readerPromise?: string | null;
  readerPayoff?: string | null;
  nextHook?: string | null;
  constraints?: unknown;
  orderIndex: number;
  canonStatus?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ScenePlanInput = Partial<Omit<ScenePlan, 'id' | 'projectId' | 'chapterId' | 'sceneId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface SceneVersion {
  id: string;
  projectId: string;
  chapterId: string;
  sceneId: string;
  source?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  content: string;
  wordCount?: number | null;
  changeSummary?: string | null;
  basedOnVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SceneVersionInput = Partial<Omit<SceneVersion, 'id' | 'projectId' | 'chapterId' | 'sceneId' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { content?: string };

export interface SceneSummary {
  id: string;
  projectId: string;
  chapterId: string;
  sceneId: string;
  sceneVersionId?: string | null;
  summary: string;
  keyEvents?: unknown;
  characterChanges?: unknown;
  locationChanges?: unknown;
  factionChanges?: unknown;
  worldRuleChanges?: unknown;
  newFacts?: unknown;
  readerVisibleInfo?: unknown;
  canonStatus?: string | null;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SceneSummaryInput = Partial<Omit<SceneSummary, 'id' | 'projectId' | 'chapterId' | 'sceneId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { summary?: string };

export interface SceneHandoff {
  id: string;
  projectId: string;
  chapterId: string;
  sceneId: string;
  sceneVersionId?: string | null;
  nextSceneId?: string | null;
  readerKnows?: unknown;
  actualChanges?: unknown;
  openQuestions?: unknown;
  promisesOpened?: unknown;
  promisesClosed?: unknown;
  nextSceneMust?: unknown;
  riskNotes?: unknown;
  canonStatus?: string | null;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type SceneHandoffInput = Partial<Omit<SceneHandoff, 'id' | 'projectId' | 'chapterId' | 'sceneId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface SceneReadinessItem {
  key: string;
  ready: boolean;
  message: string;
}

export interface SceneReadiness {
  ready: boolean;
  score: number;
  total: number;
  items: SceneReadinessItem[];
  warnings: string[];
}

export interface SceneProfile {
  scene: Scene;
  currentPlan?: ScenePlan | null;
  currentVersion?: SceneVersion | null;
  latestSummary?: SceneSummary | null;
  latestHandoff?: SceneHandoff | null;
  povCharacter?: Record<string, unknown> | null;
  primaryLocation?: Record<string, unknown> | null;
  readiness?: SceneReadiness;
}

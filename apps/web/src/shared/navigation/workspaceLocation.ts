type AppView = 'shelf' | 'settings';
type ProjectViewMode = 'shelf' | 'manual-create' | 'workspace';
type WorkspaceSection = 'info' | 'planning' | 'chapters' | 'scenes' | 'characters' | 'locations' | 'factions' | 'species' | 'rules' | 'worldItems' | 'assets';
type ChapterTab = 'flow' | 'body' | 'summaries' | 'versions' | 'overview';
type SceneTab = 'plan' | 'version' | 'summary' | 'handoff';
type EntityDetailTab = 'overview' | 'relations';

type FilterState = { type?: string; status?: string; importance?: string };

export type NovelLocationState = {
  app?: AppView;
  view?: ProjectViewMode;
  projectId?: string;
  section?: WorkspaceSection;
  chapterId?: string;
  chapterTab?: ChapterTab;
  sceneId?: string;
  sceneTab?: SceneTab;
  volumeId?: string;
  planId?: string;
  includeArchived?: boolean;
};

export type EntityModuleState = {
  selectedId?: string;
  query?: string;
  filter?: FilterState;
  detailTab?: EntityDetailTab;
};

const locationStorageKey = 'ai-novel-workbench.location.v1';
const entityStoragePrefix = 'ai-novel-workbench.entity-module.v1';
const projectViewModes: ProjectViewMode[] = ['shelf', 'manual-create', 'workspace'];
const appViews: AppView[] = ['shelf', 'settings'];
const workspaceSections: WorkspaceSection[] = ['info', 'planning', 'chapters', 'scenes', 'characters', 'locations', 'factions', 'species', 'rules', 'worldItems', 'assets'];
const chapterTabs: ChapterTab[] = ['flow', 'body', 'summaries', 'versions', 'overview'];
const sceneTabs: SceneTab[] = ['plan', 'version', 'summary', 'handoff'];
const entityDetailTabs: EntityDetailTab[] = ['overview', 'relations'];

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredLocation(): NovelLocationState {
  if (!canUseBrowserStorage()) return {};
  try {
    const raw = window.localStorage.getItem(locationStorageKey);
    if (!raw) return {};
    return normalizeLocation(JSON.parse(raw) as NovelLocationState);
  } catch {
    return {};
  }
}

function writeStoredLocation(next: NovelLocationState) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(locationStorageKey, JSON.stringify(next));
  } catch {
    // Ignore storage quota/privacy errors. URL remains the source of truth for this session.
  }
}

function pickAllowed<T extends string>(value: string | null | undefined, allowed: readonly T[]): T | undefined {
  return value && allowed.includes(value as T) ? value as T : undefined;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeLocation(value: NovelLocationState): NovelLocationState {
  return {
    app: pickAllowed(value.app, appViews),
    view: pickAllowed(value.view, projectViewModes),
    projectId: normalizeString(value.projectId),
    section: pickAllowed(value.section, workspaceSections),
    chapterId: normalizeString(value.chapterId),
    chapterTab: pickAllowed(value.chapterTab, chapterTabs),
    sceneId: normalizeString(value.sceneId),
    sceneTab: pickAllowed(value.sceneTab, sceneTabs),
    volumeId: normalizeString(value.volumeId),
    planId: normalizeString(value.planId),
    includeArchived: typeof value.includeArchived === 'boolean' ? value.includeArchived : undefined,
  };
}

function readUrlLocation(): NovelLocationState {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const app = pickAllowed(params.get('app'), appViews);
  const section = pickAllowed(params.get('section'), workspaceSections);
  const view = params.get('view') === 'create' ? 'manual-create' : pickAllowed(params.get('view'), projectViewModes);
  const includeArchivedParam = params.get('includeArchived');
  return normalizeLocation({
    app,
    view,
    projectId: params.get('projectId') ?? undefined,
    section,
    chapterId: params.get('chapterId') ?? undefined,
    chapterTab: pickAllowed(params.get('chapterTab'), chapterTabs),
    sceneId: params.get('sceneId') ?? undefined,
    sceneTab: pickAllowed(params.get('sceneTab'), sceneTabs),
    volumeId: params.get('volumeId') ?? undefined,
    planId: params.get('planId') ?? undefined,
    includeArchived: includeArchivedParam === null ? undefined : includeArchivedParam === '1' || includeArchivedParam === 'true',
  });
}

function removeScopedParams(params: URLSearchParams) {
  ['app', 'view', 'projectId', 'section', 'chapterId', 'chapterTab', 'sceneId', 'sceneTab', 'volumeId', 'planId', 'includeArchived'].forEach((key) => params.delete(key));
}

function writeUrlLocation(next: NovelLocationState, history: 'push' | 'replace' = 'replace') {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  removeScopedParams(params);
  if (next.app === 'settings') {
    params.set('app', 'settings');
  } else if (next.view) {
    params.set('view', next.view === 'manual-create' ? 'create' : next.view);
  }
  if (next.projectId) params.set('projectId', next.projectId);
  if (next.section) params.set('section', next.section);
  if (next.chapterId) params.set('chapterId', next.chapterId);
  if (next.chapterTab) params.set('chapterTab', next.chapterTab);
  if (next.sceneId) params.set('sceneId', next.sceneId);
  if (next.sceneTab) params.set('sceneTab', next.sceneTab);
  if (next.volumeId) params.set('volumeId', next.volumeId);
  if (next.planId) params.set('planId', next.planId);
  if (next.includeArchived !== undefined) params.set('includeArchived', next.includeArchived ? '1' : '0');

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    if (history === 'push') window.history.pushState(null, '', nextUrl);
    else window.history.replaceState(null, '', nextUrl);
  }
}

export function readInitialNovelLocation(): NovelLocationState {
  const stored = readStoredLocation();
  const url = readUrlLocation();
  return normalizeLocation({ ...stored, ...url });
}

export function updateNovelLocation(patch: NovelLocationState, options: { history?: 'push' | 'replace' } = {}) {
  const next = normalizeLocation({ ...readStoredLocation(), ...patch });
  writeStoredLocation(next);
  writeUrlLocation(next, options.history ?? 'replace');
}

export function resetToShelf(projectId?: string) {
  updateNovelLocation({ app: 'shelf', view: 'shelf', projectId, section: undefined, chapterId: undefined, chapterTab: undefined, sceneId: undefined, sceneTab: undefined, volumeId: undefined, planId: undefined, includeArchived: undefined });
}

export function resetToSettings() {
  updateNovelLocation({ app: 'settings', view: undefined, projectId: undefined, section: undefined, chapterId: undefined, chapterTab: undefined, sceneId: undefined, sceneTab: undefined, volumeId: undefined, planId: undefined, includeArchived: undefined });
}

function entityStorageKey(projectId: string, kind: string) {
  return `${entityStoragePrefix}:${projectId}:${kind}`;
}

export function readEntityModuleState(projectId: string, kind: string): EntityModuleState {
  if (!canUseBrowserStorage()) return {};
  try {
    const raw = window.localStorage.getItem(entityStorageKey(projectId, kind));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EntityModuleState;
    return {
      selectedId: normalizeString(parsed.selectedId),
      query: typeof parsed.query === 'string' ? parsed.query : '',
      filter: parsed.filter && typeof parsed.filter === 'object' ? {
        type: normalizeString(parsed.filter.type),
        status: normalizeString(parsed.filter.status),
        importance: normalizeString(parsed.filter.importance),
      } : {},
      detailTab: pickAllowed(parsed.detailTab, entityDetailTabs),
    };
  } catch {
    return {};
  }
}

export function writeEntityModuleState(projectId: string, kind: string, state: EntityModuleState) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(entityStorageKey(projectId, kind), JSON.stringify(state));
  } catch {
    // Non-critical UI memory.
  }
}

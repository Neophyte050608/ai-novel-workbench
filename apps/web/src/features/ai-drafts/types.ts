export type GeneratedDraftStatus = 'pending' | 'applied' | 'discarded' | 'superseded' | string;

export interface GeneratedDraft {
  id: string;
  projectId: string;
  targetType: string;
  targetId?: string | null;
  draftType: string;
  payload: unknown;
  textPreview?: string | null;
  status: GeneratedDraftStatus;
  sourceTaskId?: string | null;
  feedback?: string | null;
  previousDraftId?: string | null;
  appliedTargetType?: string | null;
  appliedTargetId?: string | null;
  appliedAt?: string | null;
  discardedAt?: string | null;
  supersededAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AiDraftListQuery {
  targetType?: string;
  targetId?: string;
  status?: GeneratedDraftStatus;
}

export interface CreateAiDraftInput {
  targetType: string;
  targetId?: string | null;
  draftType: string;
  payload: unknown;
  textPreview?: string | null;
  sourceTaskId?: string | null;
  feedback?: string | null;
  previousDraftId?: string | null;
}

export interface UpdateAiDraftInput {
  payload?: unknown;
  textPreview?: string | null;
  feedback?: string | null;
}

export interface ApplyAiDraftInput {
  activate?: boolean;
}

export interface RegenerateAiDraftInput {
  feedback?: string;
}

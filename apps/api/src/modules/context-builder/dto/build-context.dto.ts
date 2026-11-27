export type ContextPurpose = 'generate_chapter' | 'generate_scene' | 'continue_chapter' | 'summarize_chapter';

export class BuildContextDto {
  purpose!: ContextPurpose;
  chapterId?: string;
  sceneId?: string;
  includeDrafts?: boolean;
  selectedDraftIds?: string[];
  previousChapterCount?: number;
}

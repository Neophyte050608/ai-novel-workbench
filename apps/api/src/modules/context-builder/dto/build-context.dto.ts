export const contextPurposes = [
  'generate_project_profile',
  'generate_characters',
  'generate_locations',
  'generate_factions',
  'generate_world_rules',
  'generate_volume',
  'generate_chapter_plan',
  'generate_scene_plan',
  'generate_scene',
  'generate_chapter',
  'summarize_chapter',
  'extract_memory',
] as const;

export type ContextPurpose = (typeof contextPurposes)[number];

export class BuildContextDto {
  purpose!: ContextPurpose;
  chapterId?: string;
  sceneId?: string;
  includeDrafts?: boolean;
  selectedDraftIds?: string[];
  previousChapterCount?: number;
}

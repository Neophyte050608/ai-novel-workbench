import type { Prisma } from '@prisma/client';

export class UpdateProjectDto {
  title?: string;
  subtitle?: string;
  status?: string;
  genreIds?: string[];
  primaryGenreId?: string;
  tagIds?: string[];
  logline?: string;
  summary?: string;
  premise?: string;
  coreIdea?: string;
  mainPlot?: string;
  intro?: string;
  storySeed?: string;
  worldview?: string;
  eraBackground?: string;
  targetLength?: string;
  estimatedChapters?: number;
  wordsPerChapter?: number;
  language?: string;
  writingStyle?: string;
  tone?: string;
  pov?: string;
  protagonist?: string;
  coverAssetId?: string;
  metadata?: Prisma.InputJsonValue;
}

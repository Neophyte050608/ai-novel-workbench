export class UpdateChapterDto {
  title?: string;
  plannedTitle?: string | null;
  goal?: string | null;
  orderIndex?: number;
  status?: string;
  volumeId?: string | null;
}

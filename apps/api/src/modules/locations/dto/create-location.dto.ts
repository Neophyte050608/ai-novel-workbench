export class CreateLocationDto {
  parentId?: string;
  name!: string;
  aliases?: string[];
  locationType?: string;
  narrativeRole?: string;
  summary?: string;
  description?: string;
  environment?: string;
  atmosphere?: string;
  terrain?: string;
  climate?: string;
  accessRule?: string;
  dangerLevel?: string;
  lifecycleStatus?: string;
  visibility?: string;
  importance?: number;
  orderIndex?: number;
  sourceType?: string;
  sourceId?: string;
}

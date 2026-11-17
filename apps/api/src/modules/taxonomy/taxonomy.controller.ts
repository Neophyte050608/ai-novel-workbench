import { Controller, Get } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get('genres')
  genres() {
    return this.taxonomy.listGenres();
  }

  @Get('tags')
  tags() {
    return this.taxonomy.listTags();
  }
}

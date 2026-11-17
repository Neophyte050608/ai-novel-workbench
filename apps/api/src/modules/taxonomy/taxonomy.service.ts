import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  listGenres() {
    return this.prisma.genre.findMany({
      where: { isEnabled: true, deletedAt: null },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
    });
  }

  listTags() {
    return this.prisma.tag.findMany({
      where: { isEnabled: true, deletedAt: null },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
    });
  }
}

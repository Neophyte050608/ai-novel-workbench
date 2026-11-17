import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectInclude = {
  genres: { include: { genre: true }, orderBy: { createdAt: 'asc' as const } },
  tags: { include: { tag: true }, orderBy: { createdAt: 'asc' as const } },
  _count: {
    select: {
      chapters: true,
      characters: true,
      worldItems: true,
      generationTasks: true,
    },
  },
} as const;

function splitRelations<T extends CreateProjectDto | UpdateProjectDto>(dto: T) {
  const { genreIds, tagIds, primaryGenreId, ...data } = dto;
  return { data, genreIds, tagIds, primaryGenreId };
}

function uniqueIds(ids?: string[]) {
  if (!ids) {
    return undefined;
  }
  return [...new Set(ids.filter((id) => typeof id === 'string' && id.trim().length > 0))];
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.project.findMany({
      where: { deletedAt: null },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    this.validateCreate(dto);
    const { data, genreIds, tagIds, primaryGenreId } = splitRelations(dto);
    const normalizedGenreIds = uniqueIds(genreIds);
    const normalizedTagIds = uniqueIds(tagIds);
    await this.validateRelations(normalizedGenreIds, normalizedTagIds, primaryGenreId);

    return this.prisma.project.create({
      data: {
        ...data,
        title: dto.title.trim(),
        genres: normalizedGenreIds?.length
          ? { create: normalizedGenreIds.map((genreId) => ({ genreId, isPrimary: genreId === primaryGenreId || (!primaryGenreId && genreId === normalizedGenreIds[0]) })) }
          : undefined,
        tags: normalizedTagIds?.length ? { create: normalizedTagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: projectInclude,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    this.validateUpdate(dto);
    const { data, genreIds, tagIds, primaryGenreId } = splitRelations(dto);
    const normalizedGenreIds = uniqueIds(genreIds);
    const normalizedTagIds = uniqueIds(tagIds);
    await this.validateRelations(normalizedGenreIds, normalizedTagIds, primaryGenreId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.project.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
      if (!existing) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      if (normalizedGenreIds) {
        await tx.projectGenre.deleteMany({ where: { projectId: id } });
        if (normalizedGenreIds.length) {
          await tx.projectGenre.createMany({
            data: normalizedGenreIds.map((genreId) => ({ projectId: id, genreId, isPrimary: genreId === primaryGenreId || (!primaryGenreId && genreId === normalizedGenreIds[0]) })),
          });
        }
      }
      if (normalizedTagIds) {
        await tx.projectTag.deleteMany({ where: { projectId: id } });
        if (normalizedTagIds.length) {
          await tx.projectTag.createMany({ data: normalizedTagIds.map((tagId) => ({ projectId: id, tagId })) });
        }
      }
      return tx.project.update({ where: { id }, data: this.normalizeProjectData(data), include: projectInclude });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.project.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: projectInclude,
    });
  }

  private validateCreate(dto: CreateProjectDto) {
    if (!dto || typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('title is required');
    }
  }

  private validateUpdate(dto: UpdateProjectDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('request body cannot be empty');
    }
    if (dto.title !== undefined && (typeof dto.title !== 'string' || dto.title.trim().length === 0)) {
      throw new BadRequestException('title cannot be empty');
    }
  }

  private normalizeProjectData(data: Omit<CreateProjectDto | UpdateProjectDto, 'genreIds' | 'tagIds' | 'primaryGenreId'>) {
    return {
      ...data,
      title: typeof data.title === 'string' ? data.title.trim() : data.title,
    };
  }

  private async validateRelations(genreIds?: string[], tagIds?: string[], primaryGenreId?: string) {
    if (primaryGenreId && (!genreIds || !genreIds.includes(primaryGenreId))) {
      throw new BadRequestException('primaryGenreId must be included in genreIds');
    }

    if (genreIds?.length) {
      const count = await this.prisma.genre.count({ where: { id: { in: genreIds }, isEnabled: true, deletedAt: null } });
      if (count !== genreIds.length) {
        throw new BadRequestException('genreIds contains unknown or disabled genre');
      }
    }

    if (tagIds?.length) {
      const count = await this.prisma.tag.count({ where: { id: { in: tagIds }, isEnabled: true, deletedAt: null } });
      if (count !== tagIds.length) {
        throw new BadRequestException('tagIds contains unknown or disabled tag');
      }
    }
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateCharacterStateDto } from './dto/create-character-state.dto';
import { UpdateCharacterStateDto } from './dto/update-character-state.dto';
import { CreateCharacterIdentityDto } from './dto/create-character-identity.dto';
import { UpdateCharacterIdentityDto } from './dto/update-character-identity.dto';

const characterOrderBy = [{ importance: 'desc' as const }, { updatedAt: 'desc' as const }];
const stateOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const identityOrderBy = [{ importance: 'desc' as const }, { createdAt: 'asc' as const }];
const latestStateOrderBy = [{ orderIndex: 'desc' as const }, { createdAt: 'desc' as const }];

type CharacterData = Omit<UpdateCharacterDto, never>;
type StateData = Omit<UpdateCharacterStateDto, never>;
type IdentityData = Omit<UpdateCharacterIdentityDto, never>;

function normalizeString(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) {
  const normalized: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (field in normalized && typeof normalized[field] === 'string') {
      normalized[field] = (normalized[field] as string).trim();
    }
  }
  return normalized as T;
}

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) {
    throw new BadRequestException('request body cannot be empty');
  }
}

function assertNonNegativeInteger(value: number | undefined, field: string) {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
}

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCharacters(projectId: string) {
    await this.ensureProject(projectId);

    return this.prisma.character.findMany({
      where: { projectId, deletedAt: null },
      orderBy: characterOrderBy,
    });
  }

  async getCharacter(projectId: string, characterId: string) {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, projectId, deletedAt: null },
    });

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found in project ${projectId}`);
    }

    return character;
  }

  async createCharacter(projectId: string, dto: CreateCharacterDto) {
    this.validateCreateCharacter(dto);
    await this.ensureProject(projectId);

    return this.prisma.character.create({
      data: {
        ...this.normalizeCharacterData(dto),
        name: dto.name.trim(),
        projectId,
        canonStatus: 'draft',
      },
    });
  }

  async updateCharacter(projectId: string, characterId: string, dto: UpdateCharacterDto) {
    this.validateUpdateCharacter(dto);
    await this.getCharacter(projectId, characterId);

    return this.prisma.character.update({
      where: { id: characterId },
      data: this.normalizeCharacterData(dto),
    });
  }

  async deleteCharacter(projectId: string, characterId: string) {
    await this.getCharacter(projectId, characterId);

    return this.prisma.character.update({
      where: { id: characterId },
      data: { deletedAt: new Date() },
    });
  }

  async confirmCharacter(projectId: string, characterId: string) {
    await this.getCharacter(projectId, characterId);

    return this.prisma.character.update({
      where: { id: characterId },
      data: { canonStatus: 'confirmed' },
    });
  }

  async archiveCharacter(projectId: string, characterId: string) {
    await this.getCharacter(projectId, characterId);

    return this.prisma.character.update({
      where: { id: characterId },
      data: { canonStatus: 'archived' },
    });
  }

  async getProfile(projectId: string, characterId: string) {
    const character = await this.getCharacter(projectId, characterId);
    const [latestState, identities] = await Promise.all([
      this.prisma.characterState.findFirst({
        where: { projectId, characterId },
        orderBy: latestStateOrderBy,
      }),
      this.prisma.characterIdentity.findMany({
        where: { projectId, characterId, deletedAt: null },
        orderBy: identityOrderBy,
      }),
    ]);

    return { character, latestState, identities };
  }

  async listStates(projectId: string, characterId: string) {
    await this.getCharacter(projectId, characterId);

    return this.prisma.characterState.findMany({
      where: { projectId, characterId },
      orderBy: stateOrderBy,
    });
  }

  async getState(projectId: string, characterId: string, stateId: string) {
    await this.getCharacter(projectId, characterId);
    const state = await this.prisma.characterState.findFirst({
      where: { id: stateId, projectId, characterId },
    });

    if (!state) {
      throw new NotFoundException(`CharacterState ${stateId} not found in character ${characterId}`);
    }

    return state;
  }

  async createState(projectId: string, characterId: string, dto: CreateCharacterStateDto) {
    this.validateStateBody(dto, false);
    await this.getCharacter(projectId, characterId);
    await this.ensureChapterBoundary(projectId, dto.chapterId);

    return this.prisma.characterState.create({
      data: {
        ...this.normalizeStateData(dto),
        projectId,
        characterId,
      },
    });
  }

  async updateState(projectId: string, characterId: string, stateId: string, dto: UpdateCharacterStateDto) {
    this.validateStateBody(dto, true);
    await this.getState(projectId, characterId, stateId);
    await this.ensureChapterBoundary(projectId, dto.chapterId ?? undefined);

    return this.prisma.characterState.update({
      where: { id: stateId },
      data: this.normalizeStateData(dto),
    });
  }

  async deleteState(projectId: string, characterId: string, stateId: string) {
    await this.getState(projectId, characterId, stateId);

    return this.prisma.characterState.delete({ where: { id: stateId } });
  }

  async listIdentities(projectId: string, characterId: string) {
    await this.getCharacter(projectId, characterId);

    return this.prisma.characterIdentity.findMany({
      where: { projectId, characterId, deletedAt: null },
      orderBy: identityOrderBy,
    });
  }

  async getIdentity(projectId: string, characterId: string, identityId: string) {
    await this.getCharacter(projectId, characterId);
    const identity = await this.prisma.characterIdentity.findFirst({
      where: { id: identityId, projectId, characterId, deletedAt: null },
    });

    if (!identity) {
      throw new NotFoundException(`CharacterIdentity ${identityId} not found in character ${characterId}`);
    }

    return identity;
  }

  async createIdentity(projectId: string, characterId: string, dto: CreateCharacterIdentityDto) {
    this.validateCreateIdentity(dto);
    await this.getCharacter(projectId, characterId);

    return this.prisma.characterIdentity.create({
      data: {
        ...this.normalizeIdentityData(dto),
        title: dto.title.trim(),
        projectId,
        characterId,
        canonStatus: 'draft',
      },
    });
  }

  async updateIdentity(projectId: string, characterId: string, identityId: string, dto: UpdateCharacterIdentityDto) {
    this.validateUpdateIdentity(dto);
    await this.getIdentity(projectId, characterId, identityId);

    return this.prisma.characterIdentity.update({
      where: { id: identityId },
      data: this.normalizeIdentityData(dto),
    });
  }

  async deleteIdentity(projectId: string, characterId: string, identityId: string) {
    await this.getIdentity(projectId, characterId, identityId);

    return this.prisma.characterIdentity.update({
      where: { id: identityId },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private async ensureChapterBoundary(projectId: string, chapterId?: string | null) {
    if (chapterId === undefined || chapterId === null) {
      return;
    }
    const normalizedChapterId = chapterId.trim();
    if (!normalizedChapterId) {
      throw new BadRequestException('chapterId cannot be empty');
    }
    const chapter = await this.prisma.chapter.findFirst({ where: { id: normalizedChapterId, projectId, deletedAt: null }, select: { id: true } });
    if (!chapter) {
      throw new BadRequestException('chapterId must belong to the project');
    }
  }

  private validateCreateCharacter(dto: CreateCharacterDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateUpdateCharacter(dto: UpdateCharacterDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new BadRequestException('name cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateStateBody(dto: CreateCharacterStateDto | UpdateCharacterStateDto, requireBody: boolean) {
    if (requireBody) {
      assertNonEmptyBody(dto);
    }
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
  }

  private validateCreateIdentity(dto: CreateCharacterIdentityDto) {
    if (!dto || typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('title is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateUpdateIdentity(dto: UpdateCharacterIdentityDto) {
    assertNonEmptyBody(dto);
    if (dto.title !== undefined && (typeof dto.title !== 'string' || dto.title.trim().length === 0)) {
      throw new BadRequestException('title cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private normalizeCharacterData(data: CharacterData) {
    return normalizeOptionalStrings(data, ['name', 'kind', 'role', 'lifeStatus', 'personality', 'motivation', 'background', 'appearance', 'voiceStyle', 'arc', 'sourceType', 'sourceId']);
  }

  private normalizeStateData(data: StateData) {
    return normalizeOptionalStrings(data, ['stage', 'location', 'physicalState', 'emotionalState', 'goal', 'statusNote', 'sourceType', 'sourceId']);
  }

  private normalizeIdentityData(data: IdentityData) {
    return normalizeOptionalStrings(data, ['title', 'description', 'type', 'startsAt', 'endsAt', 'sourceType', 'sourceId']);
  }
}

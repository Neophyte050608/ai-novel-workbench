import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { GenerationModule } from './modules/generation/generation.module';
import { ContextBuilderModule } from './modules/context-builder/context-builder.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { SecretsModule } from './infrastructure/secrets/secrets.module';
import { LlmProviderModule } from './modules/llm-provider/llm-provider.module';
import { CharactersModule } from './modules/characters/characters.module';
import { WorldRulesModule } from './modules/world-rules/world-rules.module';
import { LocationsModule } from './modules/locations/locations.module';
import { FactionsModule } from './modules/factions/factions.module';
import { SpeciesModule } from './modules/species/species.module';

@Module({
  imports: [
    PrismaModule,
    SecretsModule,
    HealthModule,
    ProjectsModule,
    GenerationModule,
    ContextBuilderModule,
    PromptsModule,
    TaxonomyModule,
    LlmProviderModule,
    CharactersModule,
    WorldRulesModule,
    LocationsModule,
    FactionsModule,
    SpeciesModule,
  ],
})
export class AppModule {}

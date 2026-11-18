# 0007 Add abilities and story items

## Migration

- Prisma migration: `20261118051713_add_abilities_and_items`
- Scope: adds the P1 ability and story item foundation tables for project-scoped CRUD, timeline state tracking, rule links, profile aggregation, and canon confirmation/archive flows.

## Tables

- `StoryItem`: canonical story props/items with hierarchy, aliases, item type, narrative role, description, origin, function/effect/cost/limitation, current owner/location/status/visibility, importance/order/source metadata, soft delete, and canon status.
- `StoryItemState`: per-chapter or staged item state snapshots for owner, location, condition, power state, lifecycle, visibility, event summary, and notes.
- `StoryItemRule`: link table between `StoryItem` and `WorldRule` with relation metadata and ordering.
- `Ability`: project-level skills/abilities with aliases, type, narrative role, effect/cost/limitation/condition, source, progression, mastery notes, countermeasure, visibility, importance/order/source metadata, soft delete, and canon status.
- `AbilityRule`: link table between `Ability` and `WorldRule` with relation metadata and ordering.

## Relationships

- All new tables are project-scoped and cascade on project delete.
- `StoryItem.parentId` is a self-reference with `SET NULL` on parent deletion.
- `StoryItemState.chapterId` references `Chapter` with `SET NULL` on chapter deletion.
- Rule link tables cascade when their item/ability/world rule is deleted.

## Indexes

Indexes cover project-scoped list/filter/profile access patterns:

- item/ability name, type, canon status, importance, and soft-delete filters;
- story item parent/order hierarchy;
- state lookup by project + item + time/order and by chapter;
- rule links by project + owner entity + order, world rule, and relation type.

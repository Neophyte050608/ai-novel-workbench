import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  ['东方玄幻', 'eastern-fantasy'],
  ['仙侠', 'xianxia'],
  ['武侠', 'wuxia'],
  ['都市', 'urban'],
  ['科幻', 'sci-fi'],
  ['悬疑', 'mystery'],
  ['历史', 'historical'],
  ['奇幻', 'fantasy'],
  ['轻小说', 'light-novel'],
];

const tags = [
  ['热血', 'hot-blooded'],
  ['爽文', 'power-fantasy'],
  ['无女主', 'no-heroine'],
  ['群像', 'ensemble'],
  ['逆袭', 'comeback'],
  ['系统', 'system'],
  ['种田', 'slice-of-life-building'],
  ['权谋', 'political-intrigue'],
  ['慢热', 'slow-burn'],
];

async function main() {
  for (const [index, [name, slug]] of genres.entries()) {
    await prisma.genre.upsert({
      where: { slug },
      create: { name, slug, orderIndex: index },
      update: { name, orderIndex: index, isEnabled: true },
    });
  }

  for (const [index, [name, slug]] of tags.entries()) {
    await prisma.tag.upsert({
      where: { slug },
      create: { name, slug, orderIndex: index },
      update: { name, orderIndex: index, isEnabled: true },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

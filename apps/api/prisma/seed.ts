/**
 * Seed inicial do banco.
 * Cria 1 user, 1 portfolio, holdings baseados no legado
 * (MXRF11, VGHF11, VGIA11) e os 7 livros do roadmap.
 */

import { PrismaClient, AssetType, RiskProfile, LessonStatus } from '@prisma/client';
import { books } from './seeds/books';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ===== USER =====
  const user = await prisma.user.upsert({
    where: { email: 'lucas@local' },
    update: {},
    create: {
      email: 'lucas@local',
      name: 'Lucas',
      riskProfile: RiskProfile.BALANCED,
    },
  });
  console.log(`✓ User: ${user.email}`);

  // ===== PORTFOLIO =====
  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'seed-portfolio' },
    update: {},
    create: {
      id: 'seed-portfolio',
      userId: user.id,
      name: 'Carteira Principal',
      broker: 'Inter',
    },
  });
  console.log(`✓ Portfolio: ${portfolio.name}`);

  // ===== HOLDINGS (do print legado de 11/08/2026) =====
  const holdingsData = [
    {
      ticker: 'MXRF11',
      type: AssetType.FII,
      quantity: 73,
      avgPrice: 9.7,
      lastPrice: 9.44,
      marketValue: 689.12,
    },
    {
      ticker: 'VGHF11',
      type: AssetType.FII,
      quantity: 58,
      avgPrice: 7.07,
      lastPrice: 5.19,
      marketValue: 301.02,
    },
    {
      ticker: 'VGIA11',
      type: AssetType.FIAGRO,
      quantity: 41,
      avgPrice: 9.95,
      lastPrice: 8.4,
      marketValue: 344.4,
    },
  ];

  for (const h of holdingsData) {
    await prisma.holding.upsert({
      where: { portfolioId_ticker: { portfolioId: portfolio.id, ticker: h.ticker } },
      update: { lastPrice: h.lastPrice, marketValue: h.marketValue },
      create: {
        portfolioId: portfolio.id,
        ticker: h.ticker,
        type: h.type,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        lastPrice: h.lastPrice,
        marketValue: h.marketValue,
      },
    });
  }
  console.log(`✓ ${holdingsData.length} holdings seedeados`);

  // ===== ROADMAP (7 livros) =====
  for (const book of books) {
    for (let i = 0; i < book.lessons.length; i++) {
      await prisma.bookProgress.upsert({
        where: {
          userId_bookSlug_lessonIdx: {
            userId: user.id,
            bookSlug: book.slug,
            lessonIdx: i,
          },
        },
        update: {},
        create: {
          userId: user.id,
          bookSlug: book.slug,
          lessonIdx: i,
          status: LessonStatus.STARTED,
        },
      });
    }
  }
  console.log(`✓ ${books.length} livros seedeados (${books.reduce((acc, b) => acc + b.lessons.length, 0)} lições)`);

  console.log('✅ Seed concluído');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

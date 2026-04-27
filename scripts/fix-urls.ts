import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeUrl } from '../lib/youthApi';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const all = await prisma.youthPolicy.findMany({ select: { plcyNo: true, applicationUrl: true } });

  let fixed = 0;
  await Promise.all(all.map(async (p) => {
    const original = p.applicationUrl ?? '';
    const normalized = normalizeUrl(original);
    if (normalized !== original) {
      await prisma.youthPolicy.update({ where: { plcyNo: p.plcyNo }, data: { applicationUrl: normalized || null } });
      console.log(`  ${original} → ${normalized || '(null)'}`);
      fixed++;
    }
  }));

  console.log(`\n완료: ${fixed}건 수정`);
}
main().finally(() => prisma.$disconnect());

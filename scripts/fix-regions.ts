import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { zipCdToRegions } from '../lib/youthApi';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const policies = await prisma.youthPolicy.findMany({
    select: { plcyNo: true, zipCodes: true },
  });

  let updated = 0;
  await Promise.all(
    policies.map(async (p) => {
      const region = p.zipCodes ? zipCdToRegions(p.zipCodes) : '';
      await prisma.youthPolicy.update({
        where: { plcyNo: p.plcyNo },
        data: { region },
      });
      updated++;
      if (updated % 100 === 0) console.log(`${updated}/${policies.length} 처리 중...`);
    }),
  );

  console.log(`완료: 총 ${updated}건 region 재계산`);
}

main().finally(() => prisma.$disconnect());

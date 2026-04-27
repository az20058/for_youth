import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const SIDO_MAP: Record<string, string> = {
  '11': '서울', '21': '부산', '22': '대구', '23': '인천', '24': '광주',
  '25': '대전', '26': '울산', '29': '세종', '31': '경기', '32': '강원',
  '33': '충북', '34': '충남', '35': '전북', '36': '전남', '37': '경북',
  '38': '경남', '39': '제주',
};

async function main() {
  const all = await prisma.youthPolicy.findMany({
    where: { zipCodes: { not: '' } },
    select: { zipCodes: true },
  });

  // 2자리 prefix 빈도 집계
  const prefixCount: Record<string, number> = {};
  for (const p of all) {
    for (const raw of (p.zipCodes || '').split(',')) {
      const c = raw.trim();
      if (/^\d{5}$/.test(c)) {
        const pre = c.slice(0, 2);
        prefixCount[pre] = (prefixCount[pre] || 0) + 1;
      }
    }
  }

  console.log('=== DB region 값 샘플 (zipCodes 있는 것) ===');
  const samples = await prisma.youthPolicy.findMany({
    where: { zipCodes: { not: '' } },
    select: { zipCodes: true, region: true },
    take: 8,
  });
  samples.forEach(p => console.log(` ${p.zipCodes?.slice(0, 12).padEnd(14)} → ${p.region || '(빈값)'}`));

  const total = await prisma.youthPolicy.count();
  const emptyRegion = await prisma.youthPolicy.count({ where: { region: '' } });
  console.log(`\n전체: ${total} / region 빈문자열: ${emptyRegion}`);
}
main().finally(() => prisma.$disconnect());

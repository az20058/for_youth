import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const all = await prisma.youthPolicy.findMany({ select: { applicationUrl: true } });
  const counts: Record<string, number> = {};
  for (const p of all) {
    const url = p.applicationUrl || '';
    let key: string;
    if (!url) key = '(없음)';
    else if (url.startsWith('https://')) key = 'https://';
    else if (url.startsWith('http://')) key = 'http://';
    else if (url.startsWith('www.')) key = 'www. (프로토콜 없음)';
    else key = '기타: ' + url.slice(0, 30);
    counts[key] = (counts[key] || 0) + 1;
  }
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`${String(v).padStart(5)}건  ${k}`);
  }
}
main().finally(() => prisma.$disconnect());

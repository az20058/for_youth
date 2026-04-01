'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { calculateDDay, formatDDay } from '@/lib/dday';
import { statusBadgeClass } from '@/lib/statusBadge';
import type { Application, ApplicationStatus } from '@/lib/types';

const STATUS_ORDER: Record<ApplicationStatus, number> = {
  '지원 예정': 0,
  '코테 기간': 1,
  '면접 기간': 2,
  '지원 완료': 3,
  '최종 합격': 4,
  '서류 탈락': 5,
  '코테 탈락': 6,
  '면접 탈락': 7,
};


const columns: ColumnDef<Application, unknown>[] = [
  {
    accessorKey: 'companyName',
    header: '회사명',
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'careerLevel',
    header: '경력',
  },
  {
    accessorKey: 'deadline',
    header: '마감일',
    cell: ({ getValue }) => {
      const dday = calculateDDay(getValue<Date>());
      return <span className="whitespace-nowrap">{formatDDay(dday)}</span>;
    },
  },
  {
    accessorKey: 'companySize',
    header: '기업 규모',
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    accessorKey: 'status',
    header: '지원 상태',
    cell: ({ getValue }) => {
      const status = getValue<ApplicationStatus>();
      return (
        <Badge className={cn('whitespace-nowrap text-xs', statusBadgeClass(status))}>{status}</Badge>
      );
    },
    meta: { className: 'text-right' },
  },
];

interface Props {
  applications: Application[];
}

export function ApplicationsTable({ applications }: Props) {
  const router = useRouter();
  const sorted = [...applications].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.deadline.getTime() - b.deadline.getTime();
  });
  const table = useReactTable({
    data: sorted,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-foreground/10 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => {
                const meta = header.column.columnDef.meta as { className?: string } | undefined;
                return (
                  <TableHead key={header.id} className={meta?.className}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                지원서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => router.push(`/applications/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                  return (
                    <TableCell key={cell.id} className={meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

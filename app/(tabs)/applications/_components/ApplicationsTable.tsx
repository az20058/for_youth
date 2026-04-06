'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ExternalLinkIcon, PlusIcon, CheckIcon, XIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { calculateDDay, formatDDay } from '@/lib/dday';
import { statusBadgeClass } from '@/lib/statusBadge';
import type { Application, ApplicationStatus } from '@/lib/types';
import { fetchApplications, postApplication } from '@/lib/api';
import {
  validateApplication,
  COMPANY_SIZES,
  APPLICATION_STATUSES,
  type FormErrors,
} from '@/lib/applicationValidation';

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
    cell: ({ getValue, row }) => (
      <div className="flex items-center gap-1.5">
        <Link
          href={`/applications/${row.original.id}`}
          className="font-medium after:absolute after:inset-0"
        >
          {getValue<string>()}
        </Link>
        {row.original.url && (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 text-muted-foreground hover:text-foreground"
            aria-label="채용 공고 열기"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLinkIcon className="size-3.5" />
          </a>
        )}
      </div>
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

interface NewRowState {
  companyName: string;
  careerLevel: string;
  deadline: string;
  companySize: string;
  status: string;
}

const INITIAL_NEW_ROW: NewRowState = {
  companyName: '',
  careerLevel: '',
  deadline: '',
  companySize: '',
  status: '지원 예정',
};

const cellInputClass =
  'w-full rounded bg-muted/50 px-2 py-1 text-sm ring-1 ring-foreground/10 focus:outline-none focus:ring-primary';

export function ApplicationsTable() {
  const queryClient = useQueryClient();
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState<NewRowState>(INITIAL_NEW_ROW);
  const [errors, setErrors] = useState<FormErrors>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  const mutation = useMutation({
    mutationFn: postApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsAddingRow(false);
      setNewRow(INITIAL_NEW_ROW);
      setErrors({});
    },
    onError: (error: unknown) => {
      const err = error as { errors?: FormErrors };
      if (err?.errors) setErrors(err.errors);
    },
  });

  const sorted = useMemo(
    () =>
      [...applications].sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        return a.deadline.getTime() - b.deadline.getTime();
      }),
    [applications],
  );

  const table = useReactTable({
    data: sorted,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (isAddingRow) {
      firstInputRef.current?.focus();
    }
  }, [isAddingRow]);

  function startAdding() {
    setNewRow(INITIAL_NEW_ROW);
    setErrors({});
    setIsAddingRow(true);
  }

  function handleCancel() {
    setIsAddingRow(false);
    setNewRow(INITIAL_NEW_ROW);
    setErrors({});
  }

  function handleSave() {
    const data = { ...newRow, coverLetters: [] };
    const validationErrors = validateApplication(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    mutation.mutate(data);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        {isLoading ? '불러오는 중…' : `총 ${applications.length}개의 지원서`}
      </p>
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
            {isAddingRow && (
              <TableRow className="hidden md:table-row bg-muted/20 hover:bg-muted/20">
                <TableCell>
                  <input
                    ref={firstInputRef}
                    className={cn(cellInputClass, errors.companyName && 'ring-destructive')}
                    value={newRow.companyName}
                    onChange={(e) => setNewRow((p) => ({ ...p, companyName: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    placeholder="회사명"
                  />
                </TableCell>
                <TableCell>
                  <input
                    className={cn(cellInputClass, errors.careerLevel && 'ring-destructive')}
                    value={newRow.careerLevel}
                    onChange={(e) => setNewRow((p) => ({ ...p, careerLevel: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    placeholder="신입 / 경력"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="date"
                    className={cn(cellInputClass, errors.deadline && 'ring-destructive')}
                    value={newRow.deadline}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setNewRow((p) => ({ ...p, deadline: e.target.value }))}
                    onKeyDown={handleKeyDown}
                  />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Select
                    value={newRow.companySize}
                    onValueChange={(v) => setNewRow((p) => ({ ...p, companySize: v }))}
                  >
                    <SelectTrigger
                      className={cn('h-7 text-sm', errors.companySize && 'ring-destructive ring-1')}
                      aria-label="기업 규모 선택"
                    >
                      <SelectValue placeholder="규모" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Select
                      value={newRow.status}
                      onValueChange={(v) => setNewRow((p) => ({ ...p, status: v }))}
                    >
                      <SelectTrigger className="h-7 text-sm w-auto min-w-[5.5rem]" aria-label="지원 상태 선택">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={handleSave}
                      disabled={mutation.isPending}
                      aria-label="저장"
                    >
                      <CheckIcon className="size-3.5 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={handleCancel}
                      aria-label="취소"
                    >
                      <XIcon className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  불러오는 중…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  데이터를 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 && !isAddingRow ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  지원서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="relative">
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
        {!isAddingRow && (
          <button
            type="button"
            onClick={startAdding}
            className="hidden md:flex w-full py-2 px-4 items-center gap-1 text-muted-foreground text-sm hover:bg-muted/30 transition-colors border-t border-foreground/5"
          >
            <PlusIcon className="size-3.5" />
            <span>새 행</span>
          </button>
        )}
      </div>
    </div>
  );
}

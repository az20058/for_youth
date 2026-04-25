'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ExternalLinkIcon, PlusIcon, CheckIcon, XIcon, ChevronRightIcon, Trash2Icon } from 'lucide-react';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { FlameLoading } from '@/components/ui/flame-loading';
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
import { fetchApplications, postApplication, deleteApplication, type ApplicationDTO } from '@/lib/api';
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

type FilterChip = '전체' | '진행중' | '합격' | '탈락';

const ACTIVE_STATUSES: ApplicationStatus[] = ['지원 예정', '코테 기간', '면접 기간', '지원 완료'];
const PASS_STATUSES: ApplicationStatus[] = ['최종 합격'];
const FAIL_STATUSES: ApplicationStatus[] = ['서류 탈락', '코테 탈락', '면접 탈락'];

function filterByChip(apps: Application[], chip: FilterChip): Application[] {
  if (chip === '전체') return apps;
  if (chip === '진행중') return apps.filter((a) => ACTIVE_STATUSES.includes(a.status));
  if (chip === '합격') return apps.filter((a) => PASS_STATUSES.includes(a.status));
  if (chip === '탈락') return apps.filter((a) => FAIL_STATUSES.includes(a.status));
  return apps;
}

const columns: ColumnDef<Application, unknown>[] = [
  {
    accessorKey: 'companyName',
    header: '회사명',
    cell: ({ getValue, row }) => (
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{getValue<string>()}</span>
        {row.original.url && (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
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
      const deadline = getValue<Date | null>();
      if (!deadline) return <span className="text-muted-foreground">-</span>;
      const dday = calculateDDay(deadline);
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

interface Props {
  initialData?: ApplicationDTO[];
}

export function ApplicationsTable({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const chipParam = searchParams.get('filter') as FilterChip | null;
  const validChips: FilterChip[] = ['전체', '진행중', '합격', '탈락'];
  const initialChip = chipParam && validChips.includes(chipParam) ? chipParam : '진행중';
  const [activeChip, setActiveChip] = useState<FilterChip>(initialChip);

  function handleChipChange(chip: FilterChip) {
    setActiveChip(chip);
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', chip);
    router.replace(`?${params.toString()}`, { scroll: false });
  }
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState<NewRowState>(INITIAL_NEW_ROW);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
    initialData: initialData?.map((app) => ({
      ...app,
      deadline: app.deadline ? new Date(app.deadline) : null,
    })),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeletingId(null);
      toast.success('지원서가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('지원서 삭제에 실패했습니다.');
    },
  });

  const mutation = useMutation({
    mutationFn: postApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsDrawerOpen(false);
      setIsAddingRow(false);
      setNewRow(INITIAL_NEW_ROW);
      setErrors({});
      toast.success('지원서가 추가되었습니다.');
    },
    onError: (error: unknown) => {
      const err = error as { errors?: FormErrors };
      if (err?.errors) setErrors(err.errors);
      else toast.error('지원서 추가에 실패했습니다.');
    },
  });

  const sorted = useMemo(
    () =>
      [...applications].sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        return (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity);
      }),
    [applications],
  );

  const filtered = useMemo(() => filterByChip(sorted, activeChip), [sorted, activeChip]);

  const chipCounts: Record<FilterChip, number> = useMemo(() => ({
    전체: sorted.length,
    진행중: filterByChip(sorted, '진행중').length,
    합격: filterByChip(sorted, '합격').length,
    탈락: filterByChip(sorted, '탈락').length,
  }), [sorted]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (isAddingRow) firstInputRef.current?.focus();
  }, [isAddingRow]);

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

  const chips: FilterChip[] = ['전체', '진행중', '합격', '탈락'];

  return (
    <div>
      {/* 상태 칩 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipChange(chip)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
              activeChip === chip
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {chip}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-xs font-semibold',
              activeChip === chip ? 'bg-white/20' : 'bg-background',
            )}>
              {chipCounts[chip]}
            </span>
          </button>
        ))}
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="flex flex-col gap-2 md:hidden">
        {isLoading ? (
          <FlameLoading />
        ) : isError ? (
          <p className="text-center text-muted-foreground py-12 text-sm">데이터를 불러오지 못했습니다.</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">지원서가 없습니다.</p>
        ) : (
          filtered.map((app) => {
            const dday = app.deadline ? formatDDay(calculateDDay(app.deadline)) : null;
            return (
              <div
                key={app.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border cursor-pointer hover:bg-accent transition-colors"
                onClick={() => router.push(`/applications/${app.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{app.companyName}</span>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        aria-label="채용 공고 열기"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{app.careerLevel}</span>
                    {dday && <span>·</span>}
                    {dday && <span className="text-primary font-medium">{dday}</span>}
                  </div>
                </div>
                <Badge className={cn('whitespace-nowrap text-xs shrink-0', statusBadgeClass(app.status))}>
                  {app.status}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="삭제"
                  onClick={(e) => { e.stopPropagation(); setDeletingId(app.id); }}
                >
                  <Trash2Icon className="size-4" />
                </Button>
                <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
              </div>
            );
          })
        )}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-dashed border-border text-muted-foreground text-sm hover:bg-muted/30 transition-colors"
        >
          <PlusIcon className="size-4" />
          새 지원서 추가
        </button>
      </div>

      {/* 데스크탑 테이블 뷰 */}
      <div className="hidden md:block">
        <p className="mb-3 text-sm text-muted-foreground">
          {isLoading ? '불러오는 중…' : `총 ${filtered.length}개의 지원서`}
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
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
                  <TableHead className="w-10" />
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isAddingRow && (
                <TableRow className="bg-muted/20 hover:bg-muted/20 group">
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
                      <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleSave} disabled={mutation.isPending} aria-label="저장">
                        <CheckIcon className="size-3.5 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={handleCancel} aria-label="취소">
                        <XIcon className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}><FlameLoading /></TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-12">
                    데이터를 불러오지 못했습니다.
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 && !isAddingRow ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-12">
                    지원서가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer group" onClick={() => router.push(`/applications/${row.original.id}`)}>
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                      return (
                        <TableCell key={cell.id} className={meta?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                    <TableCell className="w-10 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        aria-label="삭제"
                        onClick={() => setDeletingId(row.original.id)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isAddingRow && (
            <button
              type="button"
              onClick={() => setIsAddingRow(true)}
              className="flex w-full py-2 px-4 items-center gap-1 text-muted-foreground text-sm hover:bg-muted/30 transition-colors border-t border-foreground/5"
            >
              <PlusIcon className="size-3.5" />
              <span>새 행</span>
            </button>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>지원서 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">이 지원서를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 모바일 새 지원서 Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>새 지원서 추가</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 flex flex-col gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">회사명 *</label>
              <input
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary',
                  errors.companyName && 'border-destructive',
                )}
                value={newRow.companyName}
                onChange={(e) => setNewRow((p) => ({ ...p, companyName: e.target.value }))}
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">경력</label>
              <input
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary',
                  errors.careerLevel && 'border-destructive',
                )}
                value={newRow.careerLevel}
                onChange={(e) => setNewRow((p) => ({ ...p, careerLevel: e.target.value }))}
                placeholder="신입 / 경력"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">마감일</label>
              <input
                type="date"
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary',
                  errors.deadline && 'border-destructive',
                )}
                value={newRow.deadline}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setNewRow((p) => ({ ...p, deadline: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">기업 규모</label>
              <Select value={newRow.companySize} onValueChange={(v) => setNewRow((p) => ({ ...p, companySize: v }))}>
                <SelectTrigger className={cn(errors.companySize && 'border-destructive')} aria-label="기업 규모 선택">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">지원 상태</label>
              <Select value={newRow.status} onValueChange={(v) => setNewRow((p) => ({ ...p, status: v }))}>
                <SelectTrigger aria-label="지원 상태 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSave} disabled={mutation.isPending} className="w-full">
              저장하기
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">취소</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

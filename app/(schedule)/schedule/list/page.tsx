'use client';

import { FlameLoading } from '@/components/ui/flame-loading';
import { AddEventDialog } from '../_components/AddEventDialog';
import { ScheduleListView } from '../_components/ScheduleListView';
import { useSchedule } from '../_components/useSchedule';

export default function ScheduleListPage() {
  const {
    selectedDate,
    addDialogOpen,
    setAddDialogOpen,
    addDialogDate,
    setAddDialogDate,
    events,
    isLoading,
    isFetching,
    addMutation,
    deleteMutation,
    handleAddForDate,
  } = useSchedule();

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">일정 관리</h1>
        <AddEventDialog
          selectedDate={addDialogDate}
          onAdd={(event) => addMutation.mutate(event)}
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setAddDialogDate(selectedDate);
          }}
        />
      </div>

      {isLoading ? (
        <FlameLoading />
      ) : (
        <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-60' : ''}`}>
          <ScheduleListView
            events={events}
            onDelete={(id) => deleteMutation.mutate(id)}
            onAddForDate={handleAddForDate}
          />
        </div>
      )}
    </main>
  );
}

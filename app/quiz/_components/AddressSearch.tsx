'use client';

import { useState } from 'react';
import DaumPostcode, { type Address } from 'react-daum-postcode';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Props {
  selectedAddress?: string;
  onSelect: (sidoCode: string, sigungu: string) => void;
}

export function AddressSearch({ selectedAddress, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  function handleComplete(data: Address) {
    const sidoCode = data.zonecode.slice(0, 2);
    const sigungu = data.sigungu || data.sido;
    onSelect(sidoCode, sigungu);
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full h-14 rounded-xl justify-start px-4 text-sm gap-2"
      >
        <MapPin className="size-4 shrink-0 text-muted-foreground" />
        {selectedAddress ?? '주소 검색하기'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-md overflow-hidden">
          <DialogTitle className="px-4 pt-4 pb-2 text-base font-semibold">
            주소 검색
          </DialogTitle>
          <DaumPostcode onComplete={handleComplete} style={{ height: 460 }} />
        </DialogContent>
      </Dialog>
    </>
  );
}

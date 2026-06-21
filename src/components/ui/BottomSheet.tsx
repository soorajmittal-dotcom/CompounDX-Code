'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl bg-zinc-900 border-t border-zinc-700 animate-in slide-in-from-bottom duration-300 flex flex-col',
          className
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="w-12 h-1 rounded-full bg-zinc-700 absolute top-2 left-1/2 -translate-x-1/2" />
          {title && <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}

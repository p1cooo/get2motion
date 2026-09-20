import { useEffect } from 'react';

interface DeleteConfirmationModalProps {
  title: string;
  description: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  title,
  description,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#43342a]/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
        className="w-full max-w-sm rounded-2xl border border-[#e3d5c4] bg-[#fffaf2] p-5 shadow-2xl"
      >
        <h2 id="delete-confirmation-title" className="text-lg font-extrabold text-[#43342a]">
          {title}
        </h2>
        <p id="delete-confirmation-description" className="mt-2 text-sm leading-relaxed text-[#786659]">
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            autoFocus
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#786659] hover:bg-[#f4ebe1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-[#a94c58] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#8f3f49] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </section>
    </div>
  );
}

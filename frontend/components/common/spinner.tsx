import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center py-12">
      <Spinner className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}

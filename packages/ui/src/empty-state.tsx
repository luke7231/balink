interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-muted-foreground">
      {message}
    </div>
  );
}

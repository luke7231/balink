interface EmptyStateProps {
  message: string;
  description?: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-muted-foreground"
    >
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

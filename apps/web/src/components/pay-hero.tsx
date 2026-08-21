export function PayHero({
  payMin,
  payMax,
  payLabel,
}: {
  payMin: number | null;
  payMax: number | null;
  payLabel: string;
}) {
  if (payMin != null && payMax != null) {
    const amount =
      payMin === payMax ? String(payMin) : `${payMin}~${payMax}`;
    return (
      <p className="flex items-baseline gap-1.5 text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {amount}
        </span>
        <span className="text-base font-medium text-muted-foreground">만원</span>
      </p>
    );
  }

  if (payMin != null || payMax != null) {
    return (
      <p className="flex items-baseline gap-1.5 text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {payMin ?? payMax}
        </span>
        <span className="text-base font-medium text-muted-foreground">만원</span>
      </p>
    );
  }

  const match = payLabel.match(/^(.+?)(만원(?:대)?)$/);
  if (match) {
    return (
      <p className="flex items-baseline gap-1.5 text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {match[1].trim()}
        </span>
        <span className="text-base font-medium text-muted-foreground">
          {match[2]}
        </span>
      </p>
    );
  }

  return (
    <p className="text-lg font-semibold text-foreground">{payLabel}</p>
  );
}

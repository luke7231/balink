type FormErrorProps = {
  children: string;
  className?: string;
};

/** Inline form/action error with alert semantics for assistive tech. */
export function FormError({ children, className = "text-sm text-accent" }: FormErrorProps) {
  return (
    <p role="alert" className={className}>
      {children}
    </p>
  );
}

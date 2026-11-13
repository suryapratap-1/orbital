/** Hover text-roll: the label slides up and a copy slides in. The accessible name stays the plain text. */
export default function RollText({ children }: { children: string }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span className="roll" aria-hidden>
        <span>{children}</span>
        <span>{children}</span>
      </span>
    </>
  );
}

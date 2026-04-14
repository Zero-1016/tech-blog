interface CiteProps {
  id: string;
  label?: string;
}

export function Cite({ id, label = "참고자료로 이동" }: CiteProps) {
  return (
    <a
      href={`#ref-${id}`}
      aria-label={label}
      title={label}
      className="not-prose mx-px inline-block leading-none text-accent no-underline transition-transform align-[calc(0.15em+0.1rem)] hover:scale-110"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        className="h-[0.8em] w-[0.8em]"
        aria-hidden
      >
        <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.12" />
        <circle
          cx="8"
          cy="8"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeOpacity="0.6"
        />
        <circle cx="8" cy="4.75" r="0.95" fill="currentColor" />
        <rect x="7.15" y="6.9" width="1.7" height="5" rx="0.85" fill="currentColor" />
      </svg>
    </a>
  );
}

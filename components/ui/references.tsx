interface ReferenceItem {
  id?: string;
  title: string;
  href: string;
  description?: string;
}

interface ReferencesProps {
  title?: string;
  items: ReferenceItem[];
}

export function References({ title = "참고 자료", items }: ReferencesProps) {
  return (
    <section id="references" className="not-prose my-12 scroll-mt-24">
      <h2 className="mb-4 text-foreground">{title}</h2>
      <ul className="ml-[11px] flex flex-col border-l-2 border-border">
        {items.map((item) => {
          const external = /^https?:\/\//.test(item.href);
          const anchorId = item.id ? `ref-${item.id}` : undefined;
          return (
            <li
              key={item.href}
              id={anchorId}
              className="scroll-mt-24 target:[&>a]:border-l-accent target:[&>a]:bg-accent/5"
            >
              <a
                href={item.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="group -ml-px flex items-start gap-3 rounded-r-lg border-l-2 border-transparent py-2.5 pr-4 pl-4 no-underline transition-colors hover:border-l-accent hover:bg-card-hover"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-snug font-medium text-foreground no-underline transition-colors group-hover:text-accent">
                      {item.title}
                    </span>
                    {external && (
                      <svg
                        aria-hidden
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 flex-shrink-0 text-secondary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs leading-relaxed text-secondary/55 no-underline">
                      {item.description}
                    </p>
                  )}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import type { ReactNode } from "react";
import { SectionNav } from "@/components/section-nav";

export interface PageSection {
  id: string;
  title: string;
  content: ReactNode;
}

export function SectionPage({ title, description, header, sections, footer }: {
  title: string;
  description?: string;
  header?: ReactNode;
  sections: PageSection[];
  footer?: ReactNode;
}) {
  return (
    <div className="w-full space-y-8">
      <header className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {header ?? <>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
          {description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
        </>}
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <SectionNav title={title} sections={sections.map(({ id, title }) => ({ id, title }))} />
        <div className="min-w-0 rounded-2xl border border-border bg-card px-6 sm:px-8">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-40 border-b border-border py-7 last:border-0">
              <h3 id={`${section.id}-heading`} className="flex items-baseline gap-3 text-base font-semibold text-foreground">
                <span className="text-xs font-medium text-accent-strong dark:text-accent">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </h3>
              <div className="mt-4 min-w-0 space-y-3 text-[15px] leading-7 text-muted">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
      {footer}
    </div>
  );
}

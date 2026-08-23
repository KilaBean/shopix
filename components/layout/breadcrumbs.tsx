import Link from "next/link";

import { cn } from "@/lib/utils";

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-6 text-sm text-muted-foreground", className)}
    >
      {items.map((item, index) => (
        <span key={index}>
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {index < items.length - 1 ? " / " : null}
        </span>
      ))}
    </nav>
  );
}

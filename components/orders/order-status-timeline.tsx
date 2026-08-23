import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <span className="flex size-6 items-center justify-center rounded-full bg-destructive/10">
          <X className="size-3.5" />
        </span>
        Order cancelled
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, index) => {
        const isComplete = currentIndex >= 0 && index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs whitespace-nowrap capitalize",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mx-1 mb-4 h-px flex-1",
                  index < currentIndex ? "bg-primary" : "bg-muted",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  onDelete,
}: {
  onDelete: () => Promise<{ error: string } | void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    setPending(true);
    const result = await onDelete();
    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? "Deleting..." : "Delete product"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

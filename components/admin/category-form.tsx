"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema, type CategoryInput } from "@/lib/validation/admin-categories";

export function CategoryForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onSuccess,
}: {
  defaultValues?: Partial<CategoryInput>;
  submitLabel: string;
  onSubmit: (input: CategoryInput) => Promise<{ error: string } | void>;
  onSuccess?: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "", ...defaultValues },
  });

  async function submit(data: CategoryInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (result && "error" in result) {
      setServerError(result.error);
      return;
    }
    reset({ name: "", slug: "", description: "", ...defaultValues });
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid max-w-md gap-4" noValidate>
      {serverError ? (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField id="name" label="Name" error={errors.name?.message}>
        <Input id="name" {...register("name")} />
      </FormField>
      <FormField id="slug" label="Slug" error={errors.slug?.message}>
        <Input id="slug" {...register("slug")} />
      </FormField>
      <FormField id="description" label="Description" error={errors.description?.message}>
        <Textarea id="description" {...register("description")} />
      </FormField>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

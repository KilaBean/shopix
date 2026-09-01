"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/auth/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/db/browser";
import { getCategoryImageUrl } from "@/lib/storage";
import { categorySchema, type CategoryInput } from "@/lib/validation/admin-categories";

export function CategoryForm({
  categoryId,
  defaultValues,
  initialImagePath = null,
  parentOptions = [],
  submitLabel,
  onSubmit,
  onSuccess,
}: {
  /** Existing category id in edit mode; omitted in create mode (a fresh id is generated). */
  categoryId?: string;
  defaultValues?: Partial<CategoryInput>;
  initialImagePath?: string | null;
  /** Categories eligible to be a parent -- top level, and never this one. */
  parentOptions?: { id: string; name: string }[];
  submitLabel: string;
  onSubmit: (
    input: CategoryInput,
    imagePath: string | null,
    categoryId: string,
  ) => Promise<{ error: string } | void>;
  onSuccess?: () => void;
}) {
  // Generated up front so an image can be uploaded to its final Storage path
  // before the category row exists (create mode) or reused as-is (edit mode).
  const [id, setId] = useState(() => categoryId ?? crypto.randomUUID());
  const [imagePath, setImagePath] = useState<string | null>(initialImagePath);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Base UI's Select.Value renders the raw value without this map.
  const parentItems = useMemo(
    () => ({
      none: "None (top level)",
      ...Object.fromEntries(parentOptions.map((o) => [o.id, o.name])),
    }),
    [parentOptions],
  );
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      ...defaultValues,
    },
  });

  async function handleImageUpload(file: File) {
    setUploading(true);
    setServerError(null);

    const path = `${id}/${crypto.randomUUID()}-${file.name}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(path, file);

    if (uploadError) {
      setServerError(uploadError.message);
      setUploading(false);
      return;
    }

    const previousPath = imagePath;
    setImagePath(path);
    setUploading(false);

    if (previousPath) {
      await supabase.storage.from("category-images").remove([previousPath]);
    }
  }

  async function handleImageRemove() {
    if (!imagePath) return;
    const supabase = createClient();
    await supabase.storage.from("category-images").remove([imagePath]);
    setImagePath(null);
  }

  async function submit(data: CategoryInput) {
    setServerError(null);
    const result = await onSubmit(data, imagePath, id);
    if (result && "error" in result) {
      setServerError(result.error);
      return;
    }
    reset({
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      ...defaultValues,
    });
    setImagePath(initialImagePath);
    // Create mode only: the id just used now belongs to a real row, so the
    // next submission (adding another category) needs a fresh one.
    if (!categoryId) {
      setId(crypto.randomUUID());
    }
    toast.success("Category saved.");
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

      <FormField
        id="parent_id"
        label="Parent category"
        error={errors.parent_id?.message}
      >
        <Controller
          name="parent_id"
          control={control}
          render={({ field }) => (
            <Select
              items={parentItems}
              value={field.value ?? "none"}
              onValueChange={(value) =>
                field.onChange(value === "none" ? null : value)
              }
            >
              <SelectTrigger id="parent_id" className="w-full">
                <SelectValue placeholder="None (top level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField id="image" label="Image">
        <div className="flex items-center gap-3">
          {imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a freshly uploaded Storage object; next/image's remote-pattern config isn't worth adding for this
            <img
              src={getCategoryImageUrl(imagePath)}
              alt=""
              className="size-16 rounded-lg object-cover"
            />
          ) : null}
          <div className="flex flex-col items-start gap-1">
            <input
              id="image"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file);
              }}
              className="text-sm"
            />
            {uploading ? (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            ) : null}
            {imagePath ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-muted-foreground"
                onClick={handleImageRemove}
              >
                Remove image
              </Button>
            ) : null}
          </div>
        </div>
      </FormField>

      <Button type="submit" disabled={isSubmitting || uploading}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

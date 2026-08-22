"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatPesewas } from "@/lib/money";
import { productSchema, type ProductInput } from "@/lib/validation/admin-products";

type Category = { id: string; name: string };

export function ProductForm({
  categories,
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  categories: Category[];
  defaultValues?: Partial<ProductInput>;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<{ error: string } | void>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price_pesewas: 0,
      stock: 0,
      category_id: null,
      is_active: true,
      ...defaultValues,
    },
  });

  const price = useWatch({ control, name: "price_pesewas" });

  async function submit(data: ProductInput) {
    setServerError(null);
    const result = await onSubmit(data);
    if (result && "error" in result) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid max-w-lg gap-4" noValidate>
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
        id="price_pesewas"
        label="Price (pesewas)"
        error={errors.price_pesewas?.message}
      >
        <Input
          id="price_pesewas"
          type="number"
          min={0}
          step={1}
          {...register("price_pesewas", { valueAsNumber: true })}
        />
        <p className="text-sm text-muted-foreground">
          {formatPesewas(Number.isFinite(price) ? price : 0)}
        </p>
      </FormField>

      <FormField id="stock" label="Stock" error={errors.stock?.message}>
        <Input
          id="stock"
          type="number"
          min={0}
          step={1}
          {...register("stock", { valueAsNumber: true })}
        />
      </FormField>

      <FormField id="category_id" label="Category" error={errors.category_id?.message}>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? "none"}
              onValueChange={(value) =>
                field.onChange(value === "none" ? null : value)
              }
            >
              <SelectTrigger id="category_id" className="w-full">
                <SelectValue placeholder="Uncategorized" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField id="is_active" label="Active (visible on storefront)">
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <Switch
              id="is_active"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shippingSchema, type ShippingInput } from "@/lib/validation/checkout";

export function CheckoutForm({
  defaultFullName,
  disabled,
  submitting,
  onSubmit,
}: {
  defaultFullName?: string;
  disabled?: boolean;
  submitting: boolean;
  onSubmit: (shipping: ShippingInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingInput>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { fullName: defaultFullName ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <FormField id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
      </FormField>
      <FormField id="phone" label="Phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
      </FormField>
      <FormField id="address" label="Address" error={errors.address?.message}>
        <Input
          id="address"
          autoComplete="street-address"
          {...register("address")}
        />
      </FormField>
      <FormField id="city" label="City" error={errors.city?.message}>
        <Input id="city" autoComplete="address-level2" {...register("city")} />
      </FormField>
      <FormField id="notes" label="Notes (optional)" error={errors.notes?.message}>
        <Input id="notes" {...register("notes")} />
      </FormField>
      <Button type="submit" disabled={disabled || submitting}>
        {submitting ? "Placing order..." : "Place order"}
      </Button>
    </form>
  );
}

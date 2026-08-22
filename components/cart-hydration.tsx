"use client";

import { useEffect } from "react";

import { useCartStore } from "@/store/cart";

/**
 * Triggers the cart store's rehydration from localStorage after mount.
 * The store uses skipHydration so SSR and the initial client render both
 * see an empty cart — avoiding a hydration mismatch — then this updates
 * it to the real persisted state as a normal post-mount client update.
 */
export function CartHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}

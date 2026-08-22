import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (productId: string, quantity: number, maxQuantity: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    maxQuantity: number,
  ) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,

      addItem: (productId, quantity, maxQuantity) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId);

          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + quantity,
              maxQuantity,
            );
            return {
              items: state.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: nextQuantity }
                  : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { productId, quantity: Math.min(quantity, maxQuantity) },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      setQuantity: (productId, quantity, maxQuantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, maxQuantity)) }
              : i,
          ),
        }));
      },

      clear: () => set({ items: [] }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "shopix-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

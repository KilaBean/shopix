"use client";

import { LogOut, Menu, Moon, ShoppingCart, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { useCartStore } from "@/store/cart";

function subscribeNoop() {
  return () => {};
}

/** Hydration-safe "are we on the client yet" check without setState-in-effect. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

const rowClass =
  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent";

export function MobileNav({
  email,
  role,
}: {
  email: string | null;
  role?: "customer" | "admin" | null;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const cartCount = hasHydrated
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const isDark = mounted && resolvedTheme === "dark";

  function close() {
    setOpen(false);
  }

  return (
    <div className="sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-x-0 top-16 bottom-0 z-30 bg-background/60 backdrop-blur-sm"
            onClick={close}
          />
          <nav
            aria-label="Mobile"
            className="fixed inset-x-0 top-16 z-30 h-[50vh] animate-in slide-in-from-top-4 overflow-y-auto border-b bg-background p-3 shadow-lg duration-150"
          >
            <Link href="/cart" onClick={close} className={rowClass}>
              <ShoppingCart className="size-4" />
              Cart
              {cartCount > 0 ? (
                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </Link>

            {email ? (
              <>
                <Link href="/account" onClick={close} className={rowClass}>
                  My account
                </Link>
                <Link href="/orders" onClick={close} className={rowClass}>
                  My orders
                </Link>
                {role === "admin" ? (
                  <Link href="/admin" onClick={close} className={rowClass}>
                    Admin dashboard
                  </Link>
                ) : null}
                <button
                  type="button"
                  className={`${rowClass} w-full text-left text-destructive`}
                  onClick={() => {
                    close();
                    void signOutAction();
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={close} className={rowClass}>
                  Log in
                </Link>
                <Link href="/register" onClick={close} className={rowClass}>
                  Register
                </Link>
              </>
            )}

            <button
              type="button"
              className={`${rowClass} w-full text-left`}
              disabled={!mounted}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {isDark ? "Switch to light theme" : "Switch to dark theme"}
            </button>
          </nav>
        </>
      ) : null}
    </div>
  );
}

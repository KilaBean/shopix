import { Search } from "lucide-react";
import Link from "next/link";

import { CartButton } from "@/components/cart/cart-button";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const current = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight"
        >
          Shopix
        </Link>
        <form
          method="GET"
          action="/products"
          className="relative hidden flex-1 max-w-sm sm:block"
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            placeholder="Search products..."
            aria-label="Search products"
            className="pl-8"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <CartButton />
            <AccountMenu
              email={current?.user.email ?? null}
              role={current?.profile.role ?? null}
            />
            <ThemeToggle />
          </div>
          <MobileNav
            email={current?.user.email ?? null}
            role={current?.profile.role ?? null}
          />
        </div>
      </div>
    </header>
  );
}

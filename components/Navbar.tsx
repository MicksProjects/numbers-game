"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Sun, Moon } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Image from "next/image"

type NavLink = { href: string; label: string }
const primaryLinks: NavLink[] = []

export function SiteNavbar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // ✅ ensures theme is mounted before render to avoid mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // render stable skeleton markup to keep structure same
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6" />
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
        {/* Left: Logo */}
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-[11px] font-bold">
              <Image src="/logo.png" alt="Logo" width={24} height={24} />
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          <nav className="flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {primaryLinks.map((l) => (
                  <NavigationMenuItem key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === l.href
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {l.label}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() =>
                setTheme(resolvedTheme === "light" ? "dark" : "light")
              }
            >
              {resolvedTheme === "light" ? (
                <Sun className="size-6" />
              ) : (
                <Moon className="size-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "light" ? "dark" : "light")
            }
          >
            {resolvedTheme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle>Menu</SheetTitle>
              <div className="mt-4">
                <nav className="grid gap-1">
                  {primaryLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "rounded-md px-2 py-2 text-sm hover:bg-accent",
                        pathname === l.href ? "bg-accent" : "text-foreground"
                      )}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

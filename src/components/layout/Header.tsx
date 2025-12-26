"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface HeaderProps {
  onLoginClick?: () => void;
  onPaymentHistoryClick?: () => void;
}

export function Header({ onLoginClick, onPaymentHistoryClick }: HeaderProps) {
  return (
    <header className="relative z-50 mb-10">
      <div
        className="flex items-center justify-between 
      relative text-card-foreground rounded-2xl border border-glass-border py-1 px-1 shadow-[inset_0_0_30px_var(--glass-shadow)] backdrop-blur-xl
      "
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors
          relative text-card-foreground rounded-xl border border-glass-border py-2 px-2 shadow-[inset_0_0_30px_var(--glass-shadow)] backdrop-blur-xl
          "
        >
          <Bot className="h-6 w-6" />
          {/* <span className="font-semibold text-lg">AI Detector</span> */}
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu>
          <NavigationMenuList>
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem> */}
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/how-it-works">How It Works</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Theme Toggle & User Menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {onLoginClick && onPaymentHistoryClick && (
            <UserMenu
              onLoginClick={onLoginClick}
              onPaymentHistoryClick={onPaymentHistoryClick}
            />
          )}
        </div>
      </div>
    </header>
  );
}

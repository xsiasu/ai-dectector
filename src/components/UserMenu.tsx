"use client";

import { LogOut, CreditCard, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  onLoginClick: () => void;
  onPaymentHistoryClick: () => void;
}

export function UserMenu({
  onLoginClick,
  onPaymentHistoryClick,
}: UserMenuProps) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-1.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 transition-colors"
      >
        <LogIn className="w-4 h-4" />
      </button>
    );
  }

  // 로그인 상태
  const userEmail = user?.email || "";
  const userInitial = userEmail.charAt(0).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-white/20 transition-colors">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="프로필"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
              {userInitial}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* 사용자 정보 */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate">
              {user?.user_metadata?.full_name || userEmail}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* 메뉴 항목 */}
        <DropdownMenuItem onClick={onPaymentHistoryClick}>
          <CreditCard className="w-4 h-4" />
          결제 내역
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

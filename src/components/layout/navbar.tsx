"use client";

import { useAuth } from "@/hooks/use-auth";
import { User } from "@prisma/client";
import { Menu, Bell, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  const { signOut } = useAuth();

  // Inisial untuk avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* Mobile Menu Trigger (Placeholder for now) */}
      <Button variant="outline" size="icon" className="sm:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-600"></span>
        <span className="sr-only">Toggle notifications</span>
      </Button>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-zinc-100 outline-none">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-green-100 text-green-700 font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-zinc-500">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

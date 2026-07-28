import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { AuthUser } from "@/lib/api/auth-types";
import {
  LayoutDashboard, Boxes, LogOut, Menu, User as UserIcon, Settings, Users, Store, FolderTree, Shield,
} from "lucide-react";
import { getSession, signOut } from "@/lib/api/auth";
import { useSession, useRoles } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-account";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notification-center";
import { NavThemeToggle } from "@/components/theme-selector";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/auth" });
    return { user: session.user };
  },
  component: AuthedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["administrator","it_team","employee"] },
  { to: "/assets", label: "Assets", icon: Boxes, roles: ["administrator","it_team","employee"] },
  { to: "/employees", label: "Employees", icon: Users, roles: ["administrator","it_team","employee"] },
  { to: "/categories", label: "Categories", icon: FolderTree, roles: ["administrator","it_team","employee"] },
  { to: "/vendor-management", label: "Vendor Management", icon: Store, roles: ["administrator","it_team","employee"] },
] as const;

function AuthedLayout() {
  const { user } = useSession();
  const { roles, isAdmin, isIt, loading: rolesLoading } = useRoles(user?.id);
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = isAdmin ? "Administrator" : isIt ? "IT Team" : "Employee";
  const items = NAV.filter((n) => roles.some((r) => (n.roles as readonly string[]).includes(r))
    || (rolesLoading && n.to === "/dashboard"));

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground">
        <SidebarInner items={items} roleLabel={roleLabel} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SidebarInner items={items} roleLabel={roleLabel} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenu={() => setMobileOpen(true)} user={user} roleLabel={roleLabel} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  items, roleLabel, onNavigate,
}: { items: typeof NAV[number][]; roleLabel: string; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <div className="h-16 px-4 flex items-center gap-3 border-b border-sidebar-border">
        <img
          src="/assets/goai-logo.png"
          alt="goAI"
          className="h-9 w-auto max-w-[96px] shrink-0 rounded-md bg-white px-2 py-1 object-contain"
        />
        <div className="min-w-0">
          <div className="font-bold leading-tight text-sm">Asset Management</div>
          <div className="text-[10px] tracking-wide text-sidebar-foreground/60 leading-snug">Manage, Assign & Track Company Assets</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60">
          Signed in as <span className="text-sidebar-foreground font-medium">{roleLabel}</span>
        </div>
      </div>
    </>
  );
}

function TopBar({ onMenu, user, roleLabel }: { onMenu: () => void; user: AuthUser | null; roleLabel: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useUserProfile(user, roleLabel);
  const { isAdmin } = useRoles(user?.id);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials = (profile.fullName || user?.email || "?").slice(0, 2).toUpperCase();
  const menuItemClass = (path: string) =>
    cn(pathname === path && "bg-accent text-accent-foreground");

  return (
    <header className="h-16 bg-card border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:block">
          <div className="text-sm text-muted-foreground">goAI Asset Management</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <NavThemeToggle />
        <Badge variant="secondary" className="hidden sm:inline-flex">{roleLabel}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted rounded-md p-1 pr-2">
              <Avatar className="h-8 w-8">
                {profile.profilePicture && <AvatarImage src={profile.profilePicture} alt={profile.fullName} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{user?.email}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.email}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{roleLabel}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className={menuItemClass("/profile")}>
              <Link to="/profile"><UserIcon className="h-4 w-4 mr-2" />My Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={menuItemClass("/my-assets")}>
              <Link to="/my-assets"><Boxes className="h-4 w-4 mr-2" />My Assets</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className={menuItemClass("/account-settings")}>
              <Link to="/account-settings"><Settings className="h-4 w-4 mr-2" />Account Settings</Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild className={menuItemClass("/settings")}>
                <Link to="/settings"><Shield className="h-4 w-4 mr-2" />System Settings</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

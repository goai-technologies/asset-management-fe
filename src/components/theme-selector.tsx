import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/hooks/use-auth";
import { useUserPreferences } from "@/hooks/use-user-account";
import type { Theme } from "@/lib/theme";

function syncThemePreference(
  next: Theme,
  userId: string | undefined,
  preferences: ReturnType<typeof useUserPreferences>["preferences"],
  savePreferences: ReturnType<typeof useUserPreferences>["savePreferences"],
) {
  if (userId) {
    savePreferences({ ...preferences, darkMode: next === "dark" });
  }
}

export function NavThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user } = useSession();
  const { preferences, savePreferences } = useUserPreferences(user?.id);

  const handleToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    syncThemePreference(next, user?.id, preferences, savePreferences);
  };

  const tooltip = theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground transition-colors duration-300"
            onClick={handleToggle}
            aria-label={tooltip}
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5 transition-transform duration-300" />
            ) : (
              <Moon className="h-5 w-5 transition-transform duration-300" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

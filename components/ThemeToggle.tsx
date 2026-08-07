"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  { value: "light", label: "浅色", Icon: Sun },
  { value: "dark", label: "深色", Icon: Moon },
  { value: "system", label: "跟随系统", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      {themes.map(({ value, label, Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "default" : "ghost"}
          size="icon"
          onClick={() => setTheme(value)}
          title={label}
          className="h-7 w-7"
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}

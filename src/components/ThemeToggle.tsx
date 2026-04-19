"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Leer el tema actual del DOM (ya aplicado por el script inline de layout.tsx)
  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("deali-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("deali-theme", "light");
    }
  }

  // Evitar mismatch de hidratación — render vacío en server
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg" style={{ backgroundColor: "var(--bg-input)" }} />
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex items-center justify-center w-9 h-9 rounded-lg border transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--bg-input)",
        borderColor: "var(--border)",
        color: "var(--text-secondary)",
      }}
    >
      {isDark ? (
        <Sun className="w-4 h-4" style={{ color: "var(--teal)" }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: "var(--purple)" }} />
      )}
    </button>
  );
}

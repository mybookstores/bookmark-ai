import React, { createContext, useContext, useEffect } from 'react';
import { useStore } from '@/stores/appStore';

const ThemeContext = createContext<{ isDark: boolean }>({ isDark: false });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode, settings, setDarkMode } = useStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'auto') {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <ThemeContext.Provider value={{ isDark: isDarkMode }}>{children}</ThemeContext.Provider>;
}
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'admin-theme';

export function useTheme(initial?: Theme) {
  const [theme, setTheme] = useState<Theme>(initial ?? 'dark');

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null);
    if (stored === 'light' || stored === 'dark') {
      apply(stored);
      setTheme(stored);
      return;
    }
    apply(initial ?? 'dark');
  }, []);

  const apply = (t: Theme) => {
    const root = document.documentElement; // <html>
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(KEY, t);
  };

  const updateTheme = (t: Theme) => {
    setTheme(t);
    apply(t);
  };

  return { theme, setTheme: updateTheme };
}

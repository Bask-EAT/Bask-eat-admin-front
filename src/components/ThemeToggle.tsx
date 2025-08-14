import { Moon, Sun } from 'lucide-react'; // npm install lucide-react
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-border bg-card hover:brightness-110 transition"
      title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-fg" />
      ) : (
        <Moon size={18} className="text-fg" />
      )}
    </button>
  );
}

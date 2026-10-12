import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function DeveloperThemeButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ankt_admin_theme') ?? localStorage.getItem('viora_admin_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('ankt_admin_theme', theme); } catch { /* Theme still works when storage is unavailable. */ }
  }, [theme]);
  return <button className="icon-button" type="button" aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}>
    {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
  </button>;
}

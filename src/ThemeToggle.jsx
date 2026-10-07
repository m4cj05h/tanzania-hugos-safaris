import {h} from './locale';
import React, {useState} from 'react';
import {Moon, Sun} from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem('hugos-theme', next); } catch { /* Storage may be unavailable. */ }
  }
  return <button type="button" className="theme-toggle" onClick={toggleTheme}
    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
    {theme === 'dark' ? <Sun size={15} aria-hidden="true"/> : <Moon size={15} aria-hidden="true"/>}
    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>;
}

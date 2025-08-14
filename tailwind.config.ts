/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ← 중요
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        pri: 'var(--pri)',
        border: 'var(--border)',
        ok: 'var(--ok)',
        bad: 'var(--bad)'
      },
      boxShadow: {
        soft: 'var(--soft-shadow)',
      },
    },
  },
  plugins: [],
}

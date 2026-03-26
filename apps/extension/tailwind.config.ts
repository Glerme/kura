import type { Config } from 'tailwindcss'

export default {
  content: [
    './entrypoints/**/*.{tsx,ts,html}',
    './components/**/*.{tsx,ts}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config

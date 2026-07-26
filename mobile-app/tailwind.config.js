/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
        'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-deep': 'rgb(var(--color-primary-deep) / <alpha-value>)',
        'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
        highlight: 'rgb(var(--color-highlight) / <alpha-value>)',
        warm: 'rgb(var(--color-warm) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        'bicolor-a': 'rgb(var(--color-bicolor-a) / <alpha-value>)',
        'bicolor-b': 'rgb(var(--color-bicolor-b) / <alpha-value>)',
      },
      fontFamily: {
        opendyslexic: ['OpenDyslexic', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F9FC',
        surface: '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        'primary-text': '#172033',
        'secondary-text': '#64748B',
        'muted-text': '#94A3B8',
        'primary-accent': '#2563EB',
        'primary-accent-hover': '#1D4ED8',
        'primary-accent-subtle': '#EFF6FF',
        border: '#E5EAF1',
        'border-strong': '#CBD5E1',
        success: '#15803D',
        'success-subtle': '#F0FDF4',
        warning: '#B45309',
        'warning-subtle': '#FFFBEB',
        error: '#B91C1C',
        'error-subtle': '#FEF2F2',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
      }
    },
  },
  plugins: [],
}

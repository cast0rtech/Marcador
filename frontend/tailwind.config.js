/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bms: {
          bg: "#0b0f19",
          card: "#111827",
          border: "#1f293d",
          accent: "#3b82f6",
          danger: "#ef4444",
          warning: "#f59e0b",
          success: "#10b981",
        }
      }
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c6fff",
        "primary-light": "#9b8fff",
        accent: "#ffb347",
        success: "#5a9e6f",
        gold: "#c9a227",
        danger: "#e07060",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
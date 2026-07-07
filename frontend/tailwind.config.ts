import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2f9",
          100: "#d6e0f0",
          500: "#2d4f8e",
          600: "#233f72",
          700: "#1b3057",
        },
      },
    },
  },
  plugins: [],
};

export default config;

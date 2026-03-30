/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    { pattern: /bg-(emerald|blue|yellow|orange|red|purple|gray)-(400|500|600|700|800)\/?(10|20|30)?/ },
    { pattern: /text-(emerald|blue|yellow|orange|red|purple|gray)-(300|400|500)/ },
    { pattern: /border-(emerald|blue|yellow|orange|red|purple|gray)-(500|600|700|800)\/?(20|30)?/ },
  ],
};

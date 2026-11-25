/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./static/js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--md-background) / <alpha-value>)",
        surface: "rgb(var(--md-surface) / <alpha-value>)",
        "surface-container": "rgb(var(--md-surface-container) / <alpha-value>)",
        "surface-container-high": "rgb(var(--md-surface-container-high) / <alpha-value>)",
        ink: "rgb(var(--md-on-surface) / <alpha-value>)",
        muted: "rgb(var(--md-on-surface-variant) / <alpha-value>)",
        primary: "rgb(var(--md-primary) / <alpha-value>)",
        "on-primary": "rgb(var(--md-on-primary) / <alpha-value>)",
        "primary-container": "rgb(var(--md-primary-container) / <alpha-value>)",
        "on-primary-container": "rgb(var(--md-on-primary-container) / <alpha-value>)",
        secondary: "rgb(var(--md-secondary) / <alpha-value>)",
        outline: "rgb(var(--md-outline) / <alpha-value>)",
        "outline-variant": "rgb(var(--md-outline-variant) / <alpha-value>)",
        error: "rgb(var(--md-error) / <alpha-value>)",
        success: "rgb(var(--md-success) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

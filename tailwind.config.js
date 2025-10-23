
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,services,types,App,index}.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { night: '#07111f', accent: '#5eead4' } } }, plugins: [] };
export default config;

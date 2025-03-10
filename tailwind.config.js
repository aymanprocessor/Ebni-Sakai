/** @type {import('tailwindcss').Config} */
const primeui = require('tailwindcss-primeui');
module.exports = {
    darkMode: ['selector', '[class="app-dark"]'],
    content: ['./src/**/*.{html,ts,scss,css}', './index.html'],
    plugins: [primeui, require('tailwindcss-rtl')],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '{violet.50}',
                    100: '{violet.100}',
                    200: '{violet.200}',
                    300: '{violet.300}',
                    400: '{violet.400}',
                    500: '{violet.500}',
                    600: '{violet.600}',
                    700: '{violet.700}',
                    800: '{violet.800}',
                    900: '{violet.900}',
                    950: '{violet.950}'
                }
            }
        },
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        }
    }
};

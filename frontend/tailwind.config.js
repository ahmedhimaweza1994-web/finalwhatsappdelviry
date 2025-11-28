/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // WhatsApp Web color palette
                'wa-green': '#25D366',
                'wa-green-dark': '#128C7E',
                'wa-teal': '#075E54',
                'wa-teal-dark': '#054740',
                'wa-blue': '#34B7F1',

                // Message bubbles
                'wa-sent': '#D9FDD3',
                'wa-sent-dark': '#005C4B',
                'wa-received': '#FFFFFF',
                'wa-received-dark': '#202C33',

                // Backgrounds
                'wa-bg': '#EFEAE2',
                'wa-bg-dark': '#0B141A',
                'wa-panel': '#F0F2F5',
                'wa-panel-dark': '#111B21',
                'wa-chat-bg': '#E5DDD5',
                'wa-chat-bg-dark': '#0B141A',

                // UI elements
                'wa-border': '#E9EDEF',
                'wa-border-dark': '#2A3942',
                'wa-icon': '#54656F',
                'wa-icon-dark': '#8696A0',
                'wa-text': '#111B21',
                'wa-text-dark': '#E9EDEF',
                'wa-text-secondary': '#667781',
                'wa-text-secondary-dark': '#8696A0',
            },
            fontFamily: {
                sans: ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'sans-serif'],
            },
            boxShadow: {
                'wa': '0 1px 0.5px rgba(0,0,0,.13)',
                'wa-lg': '0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12)',
            },
            borderRadius: {
                'wa': '7.5px',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-in',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

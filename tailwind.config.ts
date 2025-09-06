import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				flow: {
					primary: 'hsl(var(--flow-primary))',
					secondary: 'hsl(var(--flow-secondary))',
					warning: 'hsl(var(--flow-warning))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-data': 'var(--gradient-data)',
				'gradient-flow': 'var(--gradient-flow)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'card': 'var(--shadow-card)'
			},
			transitionProperty: {
				'smooth': 'var(--transition-smooth)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { opacity: '0', transform: 'translateX(-20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'flow-data': {
					'0%': { transform: 'translateX(-100%)', opacity: '0' },
					'50%': { opacity: '1' },
					'100%': { transform: 'translateX(100%)', opacity: '0' }
				},
				'flow-reverse': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'50%': { opacity: '1' },
					'100%': { transform: 'translateX(-100%)', opacity: '0' }
				},
				'pulse-connection': {
					'0%, 100%': { opacity: '0.3', strokeDashoffset: '0' },
					'50%': { opacity: '1', strokeDashoffset: '10' }
				},
				'data-particle': {
					'0%': { transform: 'translateX(-20px)', opacity: '0' },
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { transform: 'translateX(400px)', opacity: '0' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--glow-primary))' },
					'50%': { boxShadow: '0 0 40px hsl(var(--glow-primary))' }
				},
				'module-pulse': {
					'0%, 100%': { backgroundColor: 'hsl(var(--primary) / 0.1)' },
					'50%': { backgroundColor: 'hsl(var(--accent) / 0.2)' }
				},
				'counter-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'fade-in-delay': 'fade-in 0.6s ease-out 0.2s both',
				'fade-in-delay-2': 'fade-in 0.6s ease-out 0.4s both',
				'fade-in-delay-3': 'fade-in 0.6s ease-out 0.6s both',
				'slide-in': 'slide-in 0.5s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'flow-data': 'flow-data 3s ease-in-out infinite',
				'flow-reverse': 'flow-reverse 3s ease-in-out infinite',
				'pulse-connection': 'pulse-connection 2s ease-in-out infinite',
				'data-particle': 'data-particle 4s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'module-pulse': 'module-pulse 3s ease-in-out infinite',
				'counter-up': 'counter-up 0.8s ease-out'
			}
		}
	},
	// Add custom CSS utilities
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: { addUtilities: any }) {
			addUtilities({
				// Animation pause state
				'.animation-paused .animate-data-particle, .animation-paused .animate-pulse-connection, .animation-paused .animate-module-pulse, .animation-paused .animate-pulse-glow': {
					'animation-play-state': 'paused'
				}
			});
		}
	],
} satisfies Config;

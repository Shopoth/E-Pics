module.exports = {
  content: [
    './src/ui/**/*.{html,js}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "on-tertiary-container": "#461f00",
        "on-primary-fixed": "#001a42",
        "on-tertiary-fixed-variant": "#723600",
        "on-primary-fixed-variant": "#004395",
        "tertiary-fixed": "#ffdcc6",
        primary: "#adc6ff",
        error: "#ffb4ab",
        outline: "#8c909f",
        "on-error-container": "#ffdad6",
        "on-secondary-fixed": "#0b1c30",
        surface: "#101415",
        "on-surface-variant": "#c2c6d6",
        "surface-tint": "#adc6ff",
        "error-container": "#93000a",
        "on-tertiary-fixed": "#311400",
        "inverse-primary": "#005ac2",
        "on-error": "#690005",
        "on-background": "#e0e3e5",
        tertiary: "#ffb786",
        "outline-variant": "#424754",
        "inverse-on-surface": "#2d3133",
        "surface-container": "#1d2022",
        "secondary-fixed-dim": "#b7c8e1",
        "on-surface": "#e0e3e5",
        "surface-dim": "#101415",
        "on-secondary": "#213145",
        "on-primary-container": "#00285d",
        "on-secondary-fixed-variant": "#38485d",
        "surface-container-low": "#191c1e",
        "surface-bright": "#363a3b",
        "surface-container-lowest": "#0b0f10",
        "inverse-surface": "#e0e3e5",
        "primary-fixed-dim": "#adc6ff",
        background: "#101415",
        "on-tertiary": "#502400",
        "on-secondary-container": "#a9bad3",
        "surface-container-high": "#272a2c",
        "tertiary-container": "#df7412",
        "on-primary": "#002e6a",
        "secondary-fixed": "#d3e4fe",
        "secondary-container": "#3a4a5f",
        "primary-fixed": "#d8e2ff",
        "tertiary-fixed-dim": "#ffb786",
        "surface-container-highest": "#323537",
        "primary-container": "#4d8eff",
        secondary: "#b7c8e1",
        "surface-variant": "#323537"
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        xs: '8px',
        xl: '64px',
        'container-margin': '24px',
        md: '24px',
        'grid-gutter': '12px',
        lg: '40px',
        sm: '16px',
        base: '4px'
      },
      fontFamily: {
        'label-caps': ['Inter'],
        'headline-lg': ['Inter'],
        'title-md': ['Inter'],
        'display-lg': ['Inter'],
        'body-lg': ['Inter'],
        'headline-lg-mobile': ['Inter'],
        'body-sm': ['Inter']
      },
      fontSize: {
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }]
      }
    }
  },
  plugins: []
};

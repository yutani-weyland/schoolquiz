// Design tokens for SchoolQuiz
export const tokens = {
  colors: {
    // Round accent colors (AA compliant on white)
    "round-1": "#F4A261", // history
    "round-2": "#7FB3FF", // science
    "round-3": "#F7A8C0", // pop culture
    "round-4": "#9EE6B4", // sport
    "round-5": "#F7D57A", // civics
    
    // Semantic colors
    primary: "#2563eb",
    secondary: "#64748b",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626",
    
    // Neutral grays
    gray: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a"
    }
  },
  
  typography: {
    fontFamily: {
      default: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif",
      dyslexic: "OpenDyslexic, system-ui, -apple-system, sans-serif"
    },
    fontSize: {
      "fluid-h1": "clamp(2.75rem, 6vw, 6rem)",
      "fluid-body": "clamp(1rem, 1.1vw, 1.125rem)"
    }
  },
  
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem"
  },
  
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem"
  },
  
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  },
  
  // Card colors - unified system
  card: {
    background: {
      light: "#ffffff",
      dark: "#1e293b" // gray-800
    },
    border: {
      light: "#e2e8f0", // gray-200
      dark: "#334155" // gray-700
    },
    borderOpacity: {
      light: "rgba(226, 232, 240, 0.5)", // gray-200/50
      dark: "rgba(51, 65, 85, 0.5)" // gray-700/50
    },
    shadow: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
    }
  }
};

// CSS custom properties for theming
export const cssVariables = `
  :root {
    --round-1: ${tokens.colors["round-1"]};
    --round-2: ${tokens.colors["round-2"]};
    --round-3: ${tokens.colors["round-3"]};
    --round-4: ${tokens.colors["round-4"]};
    --round-5: ${tokens.colors["round-5"]};
    
    --font-default: ${tokens.typography.fontFamily.default};
    --font-dyslexic: ${tokens.typography.fontFamily.dyslexic};
    
    --text-fluid-h1: ${tokens.typography.fontSize["fluid-h1"]};
    --text-fluid-body: ${tokens.typography.fontSize["fluid-body"]};
    
    --card-bg-light: ${tokens.card.background.light};
    --card-bg-dark: ${tokens.card.background.dark};
    --card-border-light: ${tokens.card.border.light};
    --card-border-dark: ${tokens.card.border.dark};
    --card-border-opacity-light: ${tokens.card.borderOpacity.light};
    --card-border-opacity-dark: ${tokens.card.borderOpacity.dark};
  }
  
  .dark {
    --card-bg: var(--card-bg-dark);
    --card-border: var(--card-border-dark);
    --card-border-opacity: var(--card-border-opacity-dark);
  }
  
  :root:not(.dark) {
    --card-bg: var(--card-bg-light);
    --card-border: var(--card-border-light);
    --card-border-opacity: var(--card-border-opacity-light);
  }
  
  .font-dyslexic {
    font-family: var(--font-dyslexic);
  }
  
  .theme-high-contrast {
    --round-1: #d97706;
    --round-2: #2563eb;
    --round-3: #dc2626;
    --round-4: #059669;
    --round-5: #7c3aed;
  }
  
  .text-large {
    font-size: 1.25rem;
    line-height: 1.75;
  }
`;

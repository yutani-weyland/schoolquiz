/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@schoolquiz/ui", "@schoolquiz/db"],

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts', // Optimize recharts imports for better tree-shaking
      '@tanstack/react-table', // Optimize react-table imports
      '@tanstack/react-virtual', // Optimize react-virtual imports
    ],
  },

  // Compress responses
  compress: true,

  // Security headers to protect against XSS, clickjacking, and other attacks
  async headers() {
    // Extract Supabase domain from environment variable for CSP
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).origin : '*.supabase.co';

    // Build Content Security Policy directives
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net unpkg.com", // Allow sparticles CDN scripts
      "worker-src 'self' blob:", // Allow web workers from same origin and blob URLs (needed for canvas-confetti)
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com", // Allow inline styles and Google Fonts CSS
      "font-src 'self' fonts.gstatic.com data:", // Google Fonts and data URIs for fonts
      "img-src 'self' data: blob: https:", // Allow images from same origin, data URIs, blobs, and HTTPS
      "connect-src 'self' " + supabaseDomain + " *.supabase.co wss://*.supabase.co", // API connections to Supabase
      "frame-src 'none'", // Prevent embedding in frames (X-Frame-Options will also handle this)
      "object-src 'none'", // Prevent plugins
      "base-uri 'self'", // Restrict base tag URLs
      "form-action 'self'", // Restrict form submissions
      "frame-ancestors 'none'", // Prevent embedding (redundant with X-Frame-Options but part of CSP)
      // Only upgrade to HTTPS in production (dev server runs on HTTP)
      ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          // Only enable HSTS in production (dev server runs on HTTP)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // HSTS: 1 year, include subdomains, allow preload
          }] : []),
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking attacks
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME type sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Limit referrer information
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              // Note: 'interest-cohort' (FLoC) has been deprecated and removed from browsers
              // Removed to avoid "Unrecognized feature" warnings
            ].filter(Boolean).join(', '),
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on', // Enable DNS prefetching for performance
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Legacy XSS protection (CSP is primary protection)
          },
        ],
      },
    ];
  },

  // OPTIMIZATION: Enable CSS minification (saves ~5.7 KiB according to Lighthouse)


  // OPTIMIZATION: Don't transpile modern JavaScript features (saves ~9 KiB)
  // Modern browsers support ES6+ features natively, no need to transpile
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Modularize imports for tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // Treat PDFKit as external package so it can access its font files
  serverExternalPackages: ['pdfkit'],

  webpack: (config, { isServer }) => {
    const webpack = require('webpack');
    const path = require('path');

    // Force @radix-ui/react-slot to use the patched version
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   '@radix-ui/react-slot': path.resolve(
    //     __dirname,
    //     '../../node_modules/.pnpm/@radix-ui+react-slot@1.2.4_patch_hash=ilxxcur4ernvigmc3hqqceacee_@types+react@18.2.0_react@18.2.0/node_modules/@radix-ui/react-slot'
    //   ),
    // };

    // Fix for next-auth CSS parsing issue in Next.js 15
    // Replace next-auth CSS imports with empty module
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /node_modules\/next-auth\/css\/index\.js$/,
        require.resolve('./webpack/next-auth-css-stub.js')
      )
    );

    // Also use ignore-loader as fallback
    config.module.rules.push({
      test: /node_modules\/next-auth\/.*\.css$/,
      use: 'ignore-loader',
    });


    // Exclude next-auth from CSS processing
    const processCssRules = (rules) => {
      if (!rules) return;

      rules.forEach((rule) => {
        if (rule && typeof rule === 'object') {
          if (Array.isArray(rule.oneOf)) {
            rule.oneOf.forEach((oneOfRule) => {
              if (oneOfRule && typeof oneOfRule === 'object' && oneOfRule.test) {
                const testStr = oneOfRule.test.toString();
                if (testStr.includes('css') || testStr.includes('scss') || testStr.includes('sass')) {
                  if (!oneOfRule.exclude) {
                    oneOfRule.exclude = [];
                  }
                  const excludes = Array.isArray(oneOfRule.exclude)
                    ? oneOfRule.exclude
                    : [oneOfRule.exclude];
                  if (!excludes.some(e => e && e.toString().includes('next-auth'))) {
                    oneOfRule.exclude = [...excludes, /node_modules\/next-auth/];
                  }
                }
              }
            });
          }
        }
      });
    };

    processCssRules(config.module.rules);

    return config;
  },
};

module.exports = nextConfig;

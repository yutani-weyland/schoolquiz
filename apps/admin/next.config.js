/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@schoolquiz/ui", "@schoolquiz/db"],
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', '@radix-ui/react-icons'],
  },
  
  // Compress responses
  compress: true,
  
  // Treat PDFKit as external package so it can access its font files
  serverExternalPackages: ['pdfkit'],
  
  webpack: (config, { isServer }) => {
    const webpack = require('webpack');
    const path = require('path');
    
    // Force @radix-ui/react-slot to use the patched version
    config.resolve.alias = {
      ...config.resolve.alias,
      '@radix-ui/react-slot': path.resolve(
        __dirname,
        '../../node_modules/.pnpm/@radix-ui+react-slot@1.2.4_patch_hash=ilxxcur4ernvigmc3hqqceacee_@types+react@18.2.0_react@18.2.0/node_modules/@radix-ui/react-slot'
      ),
    };
    
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

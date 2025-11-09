/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@schoolquiz/ui", "@schoolquiz/db"],
  serverComponentsExternalPackages: ['next-auth'],
  webpack: (config) => {
    const webpack = require('webpack');
    
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

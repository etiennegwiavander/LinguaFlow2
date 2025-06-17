const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that are not needed for client-side builds
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    
    // Suppress warnings for dynamic requires in Supabase realtime
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    // Exclude supabase/functions from TypeScript compilation
    const rules = config.module.rules;
    const tsRule = rules.find(rule => 
      rule.test && rule.test.toString().includes('tsx?')
    );
    
    if (tsRule) {
      tsRule.exclude = tsRule.exclude || [];
      if (Array.isArray(tsRule.exclude)) {
        tsRule.exclude.push(path.resolve(__dirname, 'supabase/functions'));
      } else {
        // If exclude is a function or regex, convert to array
        const originalExclude = tsRule.exclude;
        tsRule.exclude = [originalExclude, path.resolve(__dirname, 'supabase/functions')];
      }
    }
    
    return config;
  },
};

module.exports = nextConfig;
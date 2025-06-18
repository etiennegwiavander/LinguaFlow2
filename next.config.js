const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com']
  },
  optimizeFonts: false,
  // Configure for static export to work with Netlify
  trailingSlash: true,
  // Remove standalone output as it's not needed for static export
  // output: 'export', // Uncomment this if you want static export
  webpack: (config, { isServer, dev }) => {
    // Only apply these optimizations in production builds
    if (!dev) {
      // Ignore optional dependencies that are not needed for client-side builds
      if (!isServer) {
        // Add resolve.alias to completely exclude problematic modules from client bundle
        config.resolve = config.resolve || {};
        config.resolve.alias = config.resolve.alias || {};
        config.resolve.alias = {
          ...config.resolve.alias,
          'bufferutil': false,
          'utf-8-validate': false,
        };

        // Ensure fallbacks for Node.js modules
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
          stream: false,
          url: false,
          zlib: false,
          http: false,
          https: false,
          assert: false,
          os: false,
          path: false,
          buffer: false,
          util: false,
        };
      }
    }
    
    // Suppress warnings for dynamic requires in Supabase realtime
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    // Initialize plugins array if it doesn't exist
    config.plugins = config.plugins || [];
    
    // Add comprehensive IgnorePlugin to handle optional dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore Deno-specific imports when requested from supabase/functions
          if (context && context.includes('supabase/functions')) {
            return resource.startsWith('jsr:') || resource.startsWith('npm:');
          }
          
          // Ignore optional ws dependencies
          if (context && (context.includes('node_modules/ws') || context.includes('node_modules/@supabase'))) {
            return resource === 'bufferutil' || resource === 'utf-8-validate';
          }
          
          return false;
        }
      })
    );
    
    // More comprehensive exclusion of supabase/functions from all processing
    const supabaseFunctionsPath = path.resolve(__dirname, 'supabase/functions');
    
    // Exclude from all module rules
    config.module.rules.forEach(rule => {
      if (rule.test && (
        rule.test.toString().includes('tsx?') || 
        rule.test.toString().includes('jsx?') ||
        rule.test.toString().includes('ts') ||
        rule.test.toString().includes('js')
      )) {
        // Ensure exclude is an array
        if (!rule.exclude) {
          rule.exclude = [];
        } else if (typeof rule.exclude === 'function' || rule.exclude instanceof RegExp) {
          const originalExclude = rule.exclude;
          rule.exclude = [originalExclude];
        }
        
        // Add supabase/functions to exclusion list
        if (Array.isArray(rule.exclude)) {
          rule.exclude.push(supabaseFunctionsPath);
          rule.exclude.push(/supabase\/functions/);
        }
      }
    });
    
    return config;
  },
  // Exclude supabase/functions from TypeScript compilation at the Next.js level
  typescript: {
    ignoreBuildErrors: false,
  },
  // Add experimental feature to exclude directories
  experimental: {
    // This helps with build performance and avoids processing unnecessary files
    optimizePackageImports: ['lucide-react'],
  },
  // Disable SWC minification which might be causing the syntax errors
  swcMinify: false,
  // Add compiler options to help with build stability
  compiler: {
    removeConsole: false,
  },
  // Add distDir to ensure proper build output
  distDir: '.next',
};

module.exports = nextConfig;
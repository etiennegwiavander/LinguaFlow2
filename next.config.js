const path = require('path');
const webpack = require('webpack');

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
      };
    }
    
    // Suppress warnings for dynamic requires in Supabase realtime
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    // Add IgnorePlugin to completely ignore Deno-specific imports in supabase/functions
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        // Ignore any module that starts with 'jsr:' or 'npm:' when requested from supabase/functions
        checkResource(resource, context) {
          // Check if the request is coming from supabase/functions directory
          if (context && context.includes('supabase/functions')) {
            // Ignore jsr: and npm: imports which are Deno-specific
            return resource.startsWith('jsr:') || resource.startsWith('npm:');
          }
          return false;
        }
      })
    );

    // Add targeted IgnorePlugin for ws module optional dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore bufferutil and utf-8-validate when they're required by ws module
          if (context && context.includes('node_modules/ws/lib')) {
            return resource === 'bufferutil' || resource === 'utf-8-validate';
          }
          return false;
        }
      })
    );

    // Add another IgnorePlugin for any other potential ws-related issues
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(bufferutil|utf-8-validate)$/,
        contextRegExp: /node_modules\/ws/,
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
};

module.exports = nextConfig;
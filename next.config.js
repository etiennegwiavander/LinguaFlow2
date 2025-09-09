/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.pexels.com', 'images.unsplash.com']
  },
  // Configure for deployment
  trailingSlash: true,
  // Completely disable all minification
  swcMinify: false,
  // Disable compiler optimizations that might cause issues
  compiler: {
    removeConsole: false,
  },
  // Output configuration for Netlify
  // output: 'standalone', // Removed - not compatible with Netlify
  // Aggressive webpack configuration to disable minification
  webpack: (config, { isServer, dev }) => {
    // Suppress warnings for dynamic requires
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    // Completely disable all minification and optimization
    config.optimization = config.optimization || {};
    config.optimization.minimize = false;
    config.optimization.minimizer = [];
    
    // Disable Terser plugin completely
    if (config.optimization.minimizer) {
      config.optimization.minimizer = config.optimization.minimizer.filter(
        plugin => plugin.constructor.name !== 'TerserPlugin'
      );
    }
    
    // Force disable minification in all environments
    config.mode = dev ? 'development' : 'production';
    if (!dev) {
      // Override any minification settings
      config.optimization.minimize = false;
      config.optimization.usedExports = false;
      config.optimization.sideEffects = false;
    }
    
    // Add fallbacks for Node.js modules on client side
    if (!isServer) {
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
    
    return config;
  },
  // Disable problematic features for Netlify
  productionBrowserSourceMaps: false,
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Disable features that might cause build issues
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Environment-specific configuration
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

module.exports = nextConfig;
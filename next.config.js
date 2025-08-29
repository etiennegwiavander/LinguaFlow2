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
  // Disable SWC minification to avoid build issues
  swcMinify: false,
  // Output configuration for Netlify
  // output: 'standalone', // Removed - not compatible with Netlify
  // Basic webpack configuration
  webpack: (config, { isServer }) => {
    // Suppress warnings for dynamic requires
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
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
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
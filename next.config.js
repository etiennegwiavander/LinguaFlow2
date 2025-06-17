/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  transpilePackages: ['@supabase/supabase-js', '@supabase/functions-js'],
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
    
    // Ignore Supabase Edge Functions directory to prevent parsing Deno-specific syntax
    config.module.noParse = config.module.noParse || [];
    config.module.noParse.push(/supabase\/functions/);
    
    return config;
  },
};

module.exports = nextConfig;
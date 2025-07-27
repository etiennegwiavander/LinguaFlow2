// Type declarations for Deno JSR imports used in Supabase Edge Functions

declare module 'jsr:@std/http@0.224.0/server' {
  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
  }

  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeOptions
  ): Promise<void>;
}

declare module 'npm:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}
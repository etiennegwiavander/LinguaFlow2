// Ultra-safe Supabase client that avoids all problematic imports
// Uses direct HTTP calls instead of the Supabase client library

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're in a safe environment to make HTTP calls
const isRuntimeSafe = () => {
  return typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey;
};

// Direct HTTP-based auth methods
const createAuthClient = () => ({
  async signInWithPassword(credentials: { email: string; password: string }) {
    if (!isRuntimeSafe()) {
      return { data: { user: null, session: null }, error: { message: 'Not available during build' } };
    }

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { data: { user: null, session: null }, error: data };
      }

      // Store session in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data));
      }

      return { 
        data: { 
          user: data.user, 
          session: data 
        }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Network error' } 
      };
    }
  },

  async signUp(credentials: { email: string; password: string }) {
    if (!isRuntimeSafe()) {
      return { data: { user: null, session: null }, error: { message: 'Not available during build' } };
    }

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { data: { user: null, session: null }, error: data };
      }

      return { 
        data: { 
          user: data.user, 
          session: data.session 
        }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Network error' } 
      };
    }
  },

  async signOut() {
    if (!isRuntimeSafe()) {
      return { error: null };
    }

    try {
      const session = this.getStoredSession();
      if (session?.access_token) {
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      }
    } catch (error) {
      // Ignore logout errors
    }

    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
    }

    return { error: null };
  },

  async getSession() {
    if (!isRuntimeSafe()) {
      return { data: { session: null }, error: null };
    }

    const session = this.getStoredSession();
    return { data: { session }, error: null };
  },

  async getUser() {
    if (!isRuntimeSafe()) {
      return { data: { user: null }, error: null };
    }

    const session = this.getStoredSession();
    return { data: { user: session?.user || null }, error: null };
  },

  getStoredSession() {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('supabase.auth.token');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Simple implementation - just return unsubscribe function
    return { 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    };
  },

  async refreshSession() {
    if (!isRuntimeSafe()) {
      return { data: { session: null }, error: null };
    }

    const session = this.getStoredSession();
    if (!session?.refresh_token) {
      return { data: { session: null }, error: { message: 'No refresh token' } };
    }

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { data: { session: null }, error: data };
      }

      // Update stored session
      if (typeof window !== 'undefined') {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data));
      }

      return { data: { session: data }, error: null };
    } catch (error) {
      return { data: { session: null }, error: { message: 'Network error' } };
    }
  },

  admin: {
    async deleteUser(userId: string) {
      // This would require service role key, so just return mock for now
      return { data: null, error: null };
    },
  },
});

// Create a comprehensive query builder
const createQueryBuilder = (table: string, selectQuery: string, filters: string[] = []) => {
  const buildUrl = (additionalFilters: string[] = [], orderParam?: string, limitParam?: number) => {
    const allFilters = [...filters, ...additionalFilters];
    let url = `${supabaseUrl}/rest/v1/${table}?select=${selectQuery}`;
    if (allFilters.length > 0) {
      url += '&' + allFilters.join('&');
    }
    if (orderParam) {
      url += `&order=${orderParam}`;
    }
    if (limitParam) {
      url += `&limit=${limitParam}`;
    }
    return url;
  };

  const executeQuery = async (
    additionalFilters: string[] = [], 
    orderParam?: string, 
    limitParam?: number, 
    rangeHeader?: string, 
    acceptHeader?: string,
    preferHeader?: string
  ) => {
    if (!isRuntimeSafe()) {
      return { data: [], error: null, count: 0 };
    }

    const session = authClient.getStoredSession();
    const headers: any = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };

    if (acceptHeader) {
      headers['Accept'] = acceptHeader;
    }

    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    if (preferHeader) {
      headers['Prefer'] = preferHeader;
    }

    const url = buildUrl(additionalFilters, orderParam, limitParam);
    const response = await fetch(url, { headers });

    if (acceptHeader === 'application/vnd.pgrst.object+json' && response.status === 406) {
      return { data: null, error: null };
    }

    let data = null;
    let count = null;

    // Handle HEAD requests for count
    if (preferHeader?.includes('count=')) {
      const contentRange = response.headers.get('content-range');
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        count = match ? parseInt(match[1]) : 0;
      }
    }

    if (!preferHeader?.includes('head')) {
      data = await response.json();
    }
    
    if (!response.ok) {
      return { data: null, error: data || { message: 'Request failed' }, count };
    }

    return { data, error: null, count };
  };

  const builder: any = {
    // Single record methods
    async maybeSingle() {
      return executeQuery([], undefined, undefined, undefined, 'application/vnd.pgrst.object+json');
    },

    async single() {
      return executeQuery([], undefined, undefined, undefined, 'application/vnd.pgrst.object+json');
    },

    // Filter methods that return new builders
    eq: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=eq.${value}`]),
    gte: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=gte.${value}`]),
    lte: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=lte.${value}`]),
    gt: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=gt.${value}`]),
    lt: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=lt.${value}`]),
    ilike: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=ilike.${value}`]),
    like: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=like.${value}`]),
    is: (column: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=is.${value}`]),
    not: (column: string, operator: string, value: any) => createQueryBuilder(table, selectQuery, [...filters, `${column}=not.${operator}.${value}`]),

    // Order method
    order: (column: string, options?: { ascending?: boolean }) => {
      const orderParam = options?.ascending === false ? `${column}.desc` : `${column}.asc`;
      return {
        async then(callback: any) {
          const result = await executeQuery([], orderParam);
          return callback(result);
        },

        range: (from: number, to: number) => ({
          async then(callback: any) {
            const result = await executeQuery([], orderParam, undefined, `${from}-${to}`);
            return callback(result);
          },
        }),

        limit: (count: number) => ({
          async then(callback: any) {
            const result = await executeQuery([], orderParam, count);
            return callback(result);
          },
        }),
      };
    },

    // Limit method
    limit: (count: number) => ({
      async then(callback: any) {
        const result = await executeQuery([], undefined, count);
        return callback(result);
      },
    }),

    // Range method
    range: (from: number, to: number) => ({
      async then(callback: any) {
        const result = await executeQuery([], undefined, undefined, `${from}-${to}`);
        return callback(result);
      },
    }),

    // Promise interface
    async then(callback: any) {
      const result = await executeQuery();
      return callback(result);
    },
  };

  return builder;
};

// Direct HTTP-based database methods
const createDatabaseClient = () => ({
  from(table: string) {
    return {
      select(...args: any[]) {
        // Handle both select('*') and select('*', { count: 'exact' }) patterns
        const columns = typeof args[0] === 'string' ? args[0] : (args[0] || ['*']);
        const options = args[1] || {};
        const selectQuery = Array.isArray(columns) ? columns.join(',') : columns;
        
        // Handle count and head options
        if (options.count && options.head) {
          // For count with head, return a promise that resolves with count
          return {
            eq: (column: string, value: any) => ({
              async then(callback: any) {
                if (!isRuntimeSafe()) {
                  return callback({ data: null, error: null, count: 0 });
                }

                const session = authClient.getStoredSession();
                const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${selectQuery}&${column}=eq.${value}`, {
                  method: 'HEAD',
                  headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': `count=${options.count}`,
                  },
                });

                let count = 0;
                const contentRange = response.headers.get('content-range');
                if (contentRange) {
                  const match = contentRange.match(/\/(\d+)$/);
                  count = match ? parseInt(match[1]) : 0;
                }

                if (!response.ok) {
                  return callback({ data: null, error: { message: 'Request failed' }, count });
                }

                return callback({ data: null, error: null, count });
              },
            }),
            async then(callback: any) {
              if (!isRuntimeSafe()) {
                return callback({ data: null, error: null, count: 0 });
              }

              const session = authClient.getStoredSession();
              const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${selectQuery}`, {
                method: 'HEAD',
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': `count=${options.count}`,
                },
              });

              let count = 0;
              const contentRange = response.headers.get('content-range');
              if (contentRange) {
                const match = contentRange.match(/\/(\d+)$/);
                count = match ? parseInt(match[1]) : 0;
              }

              if (!response.ok) {
                return callback({ data: null, error: { message: 'Request failed' }, count });
              }

              return callback({ data: null, error: null, count });
            },
          };
        }

        return createQueryBuilder(table, selectQuery);
      },

      insert(data: any) {
        // Create the base insert functionality
        const executeInsert = async (returnType = 'minimal') => {
          if (!isRuntimeSafe()) {
            return { data: null, error: null };
          }

          const session = authClient.getStoredSession();
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
              'Content-Type': 'application/json',
              'Prefer': `return=${returnType}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            return { data: null, error };
          }

          if (returnType === 'minimal') {
            return { data: null, error: null };
          } else {
            const result = await response.json();
            return { data: result, error: null };
          }
        };

        // Create a promise for the base insert
        const insertPromise = new Promise(async (resolve, reject) => {
          try {
            const result = await executeInsert();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }) as any;

        // Add select method
        insertPromise.select = (...columns: string[]) => {
          const selectPromise = new Promise(async (resolve, reject) => {
            try {
              const result = await executeInsert('representation');
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }) as any;

          selectPromise.single = async () => {
            const result = await selectPromise;
            return { 
              data: Array.isArray(result.data) ? result.data[0] : result.data, 
              error: result.error 
            };
          };

          return selectPromise;
        };

        return insertPromise;
      },

      update(data: any) {
        return {
          eq(column: string, value: any) {
            const updatePromise = new Promise(async (resolve, reject) => {
              try {
                if (!isRuntimeSafe()) {
                  resolve({ data: null, error: null });
                  return;
                }

                const session = authClient.getStoredSession();
                const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                  },
                  body: JSON.stringify(data),
                });

                if (!response.ok) {
                  const error = await response.json();
                  resolve({ data: null, error });
                  return;
                }

                resolve({ data: null, error: null });
              } catch (error) {
                reject(error);
              }
            }) as any;

            updatePromise.select = (...columns: string[]) => ({
              async single() {
                return { data: data, error: null };
              },
            });

            return updatePromise;
          },
        };
      },

      delete() {
        return {
          async eq(column: string, value: any) {
            if (!isRuntimeSafe()) {
              return { data: null, error: null };
            }

            const session = authClient.getStoredSession();
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
              method: 'DELETE',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const error = await response.json();
              return { data: null, error };
            }

            return { data: null, error: null };
          },
        };
      },

      async upsert(data: any) {
        const upsertPromise = new Promise(async (resolve, reject) => {
          try {
            if (!isRuntimeSafe()) {
              resolve({ data: null, error: null });
              return;
            }

            const session = authClient.getStoredSession();
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal',
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              const error = await response.json();
              resolve({ data: null, error });
              return;
            }

            resolve({ data: null, error: null });
          } catch (error) {
            reject(error);
          }
        }) as any;

        upsertPromise.select = (...columns: string[]) => ({
          async single() {
            return { data: Array.isArray(data) ? data[0] : data, error: null };
          },
        });

        return upsertPromise;
      },
    };
  },
});

// Create the clients
const authClient = createAuthClient();
const dbClient = createDatabaseClient();

// Export the safe client
export const supabase = {
  auth: authClient,
  from: dbClient.from.bind(dbClient),
  functions: {
    async invoke(functionName: string, options?: any) {
      if (!isRuntimeSafe()) {
        return { data: null, error: null };
      }

      try {
        const session = authClient.getStoredSession();
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
          },
          body: JSON.stringify(options?.body || {}),
        });

        const data = await response.json();
        
        if (!response.ok) {
          return { data: null, error: data };
        }

        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: 'Network error' } };
      }
    },
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          if (!isRuntimeSafe()) {
            return { data: null, error: null };
          }

          try {
            const session = authClient.getStoredSession();
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
              },
              body: formData,
            });

            const data = await response.json();
            
            if (!response.ok) {
              return { data: null, error: data };
            }

            return { data, error: null };
          } catch (error) {
            return { data: null, error: { message: 'Upload failed' } };
          }
        },

        async download(path: string) {
          if (!isRuntimeSafe()) {
            return { data: null, error: null };
          }

          try {
            const session = authClient.getStoredSession();
            const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
              headers: {
                'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
              },
            });

            if (!response.ok) {
              const error = await response.json();
              return { data: null, error };
            }

            const blob = await response.blob();
            return { data: blob, error: null };
          } catch (error) {
            return { data: null, error: { message: 'Download failed' } };
          }
        },

        async remove(paths: string[]) {
          if (!isRuntimeSafe()) {
            return { data: null, error: null };
          }

          try {
            const session = authClient.getStoredSession();
            const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
              },
              body: JSON.stringify({ prefixes: paths }),
            });

            const data = await response.json();
            
            if (!response.ok) {
              return { data: null, error: data };
            }

            return { data, error: null };
          } catch (error) {
            return { data: null, error: { message: 'Delete failed' } };
          }
        },

        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,
            },
          };
        },
      };
    },
  },
};

// Keep the same exports for compatibility
export const handleSupabaseError = async (error: any, retryFn?: () => Promise<any>) => {
  if (error?.message?.includes('JWT expired') || 
      error?.message?.includes('Invalid JWT') ||
      error?.status === 401) {
    
    console.warn('JWT token expired, attempting to refresh...');
    
    try {
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        throw refreshError;
      }
      
      if (session && retryFn) {
        console.log('Session refreshed successfully, retrying request...');
        return await retryFn();
      }
      
      return { data: null, error: null };
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw refreshError;
    }
  }
  
  throw error;
};

export const supabaseRequest = async <T>(
  requestFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await requestFn();
    
    if (result.error) {
      return await handleSupabaseError(result.error, requestFn);
    }
    
    return result;
  } catch (error) {
    return await handleSupabaseError(error, requestFn);
  }
};

export type Database = {
  public: {
    Tables: {
      tutors: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          is_admin: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
        };
      };
      students: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          avatar_url: string | null;
          target_language: string;
          native_language: string | null;
          level: string;
          tutor_id: string;
          end_goals: string | null;
          grammar_weaknesses: string | null;
          vocabulary_gaps: string | null;
          pronunciation_challenges: string | null;
          conversational_fluency_barriers: string | null;
          learning_styles: string[] | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          avatar_url?: string | null;
          target_language: string;
          native_language?: string | null;
          level: string;
          tutor_id: string;
          end_goals?: string | null;
          grammar_weaknesses?: string | null;
          vocabulary_gaps?: string | null;
          pronunciation_challenges?: string | null;
          conversational_fluency_barriers?: string | null;
          learning_styles?: string[] | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          avatar_url?: string | null;
          target_language?: string;
          native_language?: string | null;
          level?: string;
          tutor_id?: string;
          end_goals?: string | null;
          grammar_weaknesses?: string | null;
          vocabulary_gaps?: string | null;
          pronunciation_challenges?: string | null;
          conversational_fluency_barriers?: string | null;
          learning_styles?: string[] | null;
          notes?: string | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          created_at: string;
          student_id: string;
          tutor_id: string;
          date: string;
          status: string;
          materials: string[];
          notes: string | null;
          previous_challenges: string[] | null;
          generated_lessons: string[] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          student_id: string;
          tutor_id: string;
          date: string;
          status: string;
          materials: string[];
          notes?: string | null;
          previous_challenges?: string[] | null;
          generated_lessons?: string[] | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          student_id?: string;
          tutor_id?: string;
          date?: string;
          status?: string;
          materials?: string[];
          notes?: string | null;
          previous_challenges?: string[] | null;
          generated_lessons?: string[] | null;
        };
      };
    };
  };
};
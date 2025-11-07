import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return NextResponse.json(
        { success: false, error: 'Supabase URL not configured' },
        { status: 500 }
      );
    }
    
    if (!supabaseServiceKey) {
      console.error('SERVICE_ROLE_KEY is not set');
      return NextResponse.json(
        { success: false, error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Create Supabase client with service role key for edge function calls
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-vocabulary-words', {
      body: body,
      headers: authHeader ? { Authorization: authHeader } : undefined
    });

    if (error) {
      console.error('❌ Supabase Edge Function error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        context: error.context,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Try to read the response body for more details
      let errorBody = null;
      if (error.context && error.context.body) {
        try {
          const reader = error.context.body.getReader();
          const { value } = await reader.read();
          if (value) {
            errorBody = new TextDecoder().decode(value);
            console.error('❌ Edge Function response body:', errorBody);
          }
        } catch (readError) {
          console.error('Could not read error response body:', readError);
        }
      }
      
      // Extract meaningful error message
      const errorMessage = errorBody ||
                          error.message || 
                          error.details || 
                          error.hint ||
                          'Edge Function returned a non-2xx status code';
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    console.log('Edge function response:', data);
    console.log('Edge function response keys:', data ? Object.keys(data) : 'null');
    
    // Ensure we return the correct format
    if (data && data.words) {
      return NextResponse.json({ success: true, words: data.words });
    } else {
      return NextResponse.json({ success: true, ...data });
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
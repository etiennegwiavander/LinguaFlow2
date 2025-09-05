/**
 * Unsubscribe API
 * Handles email unsubscribe requests from users
 */

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeService } from '@/lib/unsubscribe-service';

// POST /api/unsubscribe - Process unsubscribe request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, emailType } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Unsubscribe token is required'
      }, { status: 400 });
    }

    // Process unsubscribe
    const result = await unsubscribeService.processUnsubscribe(token, emailType);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('Error in POST /api/unsubscribe:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while processing your request'
    }, { status: 500 });
  }
}

// GET /api/unsubscribe - Get unsubscribe page data (for direct links)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const emailType = searchParams.get('type');

    if (!token) {
      return NextResponse.json({
        error: 'Unsubscribe token is required'
      }, { status: 400 });
    }

    // For GET requests, we just validate the token exists
    // The actual unsubscribe processing happens via POST
    return NextResponse.json({
      valid: true,
      token,
      emailType,
      message: 'Ready to process unsubscribe request'
    });

  } catch (error) {
    console.error('Error in GET /api/unsubscribe:', error);
    return NextResponse.json({
      error: 'An error occurred while validating the unsubscribe request'
    }, { status: 500 });
  }
}
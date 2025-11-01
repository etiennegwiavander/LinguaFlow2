/**
 * Email Test History API - Simplified version
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TestHistoryResponse {
  tests: Array<{
    testId: string;
    status: string;
    recipientEmail: string;
    subject: string;
    sentAt?: string;
    deliveredAt?: string;
    errorMessage?: string;
    errorCode?: string;
    retryAttempts?: number;
    metadata?: Record<string, any>;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
}

// GET /api/admin/email/test/history - Get test email history
export async function GET(request: NextRequest): Promise<NextResponse<TestHistoryResponse | { error: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Return mock test history data
    const mockTests = [
      {
        testId: 'test-001',
        status: 'delivered',
        recipientEmail: 'test@example.com',
        subject: 'Test Welcome Email',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
        retryAttempts: 0,
        metadata: { templateType: 'welcome' }
      },
      {
        testId: 'test-002',
        status: 'failed',
        recipientEmail: 'invalid@test.com',
        subject: 'Test Password Reset',
        sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        errorMessage: 'Invalid email address',
        errorCode: 'INVALID_EMAIL',
        retryAttempts: 2,
        metadata: { templateType: 'password_reset' }
      },
      {
        testId: 'test-003',
        status: 'delivered',
        recipientEmail: 'admin@example.com',
        subject: 'Test Lesson Reminder',
        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 15000).toISOString(),
        retryAttempts: 0,
        metadata: { templateType: 'lesson_reminder' }
      }
    ];

    const response: TestHistoryResponse = {
      tests: mockTests,
      totalCount: mockTests.length,
      page,
      pageSize
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/email/test/history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
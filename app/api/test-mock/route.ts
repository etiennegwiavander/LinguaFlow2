import { NextResponse } from 'next/server';
import { generateMockDashboardData } from '@/lib/mock-data';

export async function GET() {
  try {
    const data = generateMockDashboardData();
    return NextResponse.json({ 
      success: true, 
      message: 'Mock data service is working!',
      emailTypes: data.emailTypes.length,
      systemStatus: data.systemHealth.status
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
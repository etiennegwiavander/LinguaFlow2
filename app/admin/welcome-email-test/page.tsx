'use client';

import WelcomeEmailManager from '@/components/admin/WelcomeEmailManager';

export default function WelcomeEmailTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Email Testing</h1>
            <p className="text-muted-foreground">
              Test the welcome email system for LinguaFlow tutors. This interface allows you to manually send welcome emails and view email history.
            </p>
          </div>
          <WelcomeEmailManager />
        </div>
      </div>
    </div>
  );
}
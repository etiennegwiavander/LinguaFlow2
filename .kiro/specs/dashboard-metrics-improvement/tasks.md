# Implementation Plan

- [ ] 1. Create interactive material events tracking table
  - Create database migration to add `interactive_material_events` table with proper schema
  - Add indexes for efficient querying by tutor_id and created_at
  - Include event_type field to distinguish between 'create' and 'recreate' actions
  - _Requirements: 5.1, 5.2_

- [ ] 2. Implement event logging service
  - Create utility functions to log interactive material creation events
  - Add error handling and cleanup for failed event logging
  - Ensure events are only logged on successful material generation
  - _Requirements: 1.1, 1.2, 1.3, 5.4_

- [ ] 3. Integrate event logging into interactive material generation
  - Modify the `generate-interactive-material` Supabase function to log events
  - Add event logging after successful lesson update with interactive content
  - Handle both create and recreate scenarios with appropriate event types
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 4. Create metrics calculation service
  - Implement `getTotalLessonsCount()` function to count all successful events
  - Implement `getLessonsThisMonthCount()` function for current month metrics
  - Add `calculateTrendPercentages()` function for historical comparisons
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Update dashboard metrics queries
  - Replace existing `interactive_lesson_content` counting with event-based counting
  - Modify dashboard page to use new metrics calculation functions
  - Ensure proper date filtering for monthly calculations
  - _Requirements: 2.3, 2.4, 4.1, 4.2_

- [ ] 6. Add real-time metrics updates
  - Implement dashboard metrics refresh after successful material creation
  - Add Supabase real-time subscription for immediate updates
  - Update StatsCard component to handle real-time data changes
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Add TypeScript interfaces for new data models
  - Create `InteractiveMaterialEvent` interface
  - Create `DashboardMetrics` interface with trend calculations
  - Update existing types to support new metrics structure
  - _Requirements: 5.3_

- [ ] 8. Implement error handling and fallbacks
  - Add retry mechanism for event logging failures
  - Implement fallback to cached values when metrics calculation fails
  - Add user feedback for metric update failures
  - _Requirements: 1.3, 5.4_

- [ ] 9. Add comprehensive testing
  - Write unit tests for event logging functions
  - Write unit tests for metrics calculation functions
  - Write integration tests for end-to-end material creation flow
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [ ] 10. Create data migration for existing lessons
  - Create migration script to generate events for existing lessons with interactive content
  - Ensure historical data is preserved for accurate trend calculations
  - Add verification queries to confirm migration accuracy
  - _Requirements: 4.1, 4.2, 5.1_
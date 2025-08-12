# Dashboard Metrics Improvement - Requirements Document

## Introduction

The tutor dashboard currently displays "Total Lessons" and "Lessons This Month" metrics in the Quick Stats section. These metrics need to be updated to accurately reflect tutor usage by counting each interactive material creation as a separate lesson unit for consumption tracking and pricing purposes.

## Requirements

### Requirement 1

**User Story:** As a tutor, I want the "Total Lessons" metric to increment each time I successfully create interactive material for a sub-topic, so that I can track my actual AI system usage.

#### Acceptance Criteria

1. WHEN a tutor clicks "Create Interactive Material" button for a sub-topic AND the interactive material is successfully generated THEN the "Total Lessons" count SHALL increase by 1
2. WHEN a tutor clicks "Recreate Material" button for a sub-topic AND the interactive material is successfully regenerated THEN the "Total Lessons" count SHALL increase by 1
3. WHEN interactive material creation fails THEN the "Total Lessons" count SHALL NOT increase
4. WHEN a tutor generates lesson plans (without creating interactive materials) THEN the "Total Lessons" count SHALL NOT increase

### Requirement 2

**User Story:** As a tutor, I want the "Lessons This Month" metric to increment each time I successfully create interactive material for a sub-topic in the current month, so that I can monitor my monthly consumption.

#### Acceptance Criteria

1. WHEN a tutor successfully creates interactive material for a sub-topic in the current calendar month THEN the "Lessons This Month" count SHALL increase by 1
2. WHEN a tutor successfully recreates interactive material for a sub-topic in the current calendar month THEN the "Lessons This Month" count SHALL increase by 1
3. WHEN the calendar month changes THEN the "Lessons This Month" count SHALL reset to count only the current month's interactive material creations
4. WHEN interactive material is created for a sub-topic with a lesson date in a previous month THEN it SHALL still count toward the current month's total (based on creation date, not lesson date)

### Requirement 3

**User Story:** As a tutor, I want the dashboard metrics to update in real-time after I create interactive materials, so that I can immediately see my updated consumption without refreshing the page.

#### Acceptance Criteria

1. WHEN a tutor successfully creates interactive material for a sub-topic THEN the dashboard metrics SHALL update within 5 seconds without requiring a page refresh
2. WHEN the interactive material creation process completes successfully THEN both "Total Lessons" and "Lessons This Month" SHALL display the updated counts
3. WHEN multiple tutors are using the system simultaneously THEN each tutor SHALL only see their own updated metrics
4. WHEN the dashboard is refreshed manually THEN the metrics SHALL display the accurate current counts

### Requirement 4

**User Story:** As a tutor, I want the historical comparison percentages to be calculated based on actual interactive material creation activity, so that I can understand my usage trends accurately.

#### Acceptance Criteria

1. WHEN calculating "Total Lessons" change percentage THEN the system SHALL compare current total interactive materials created vs. previous month's total
2. WHEN calculating "Lessons This Month" change percentage THEN the system SHALL compare current month's interactive materials created vs. previous month's total
3. WHEN a tutor has no previous month data THEN the change percentage SHALL show +100% if current count > 0, or 0% if current count = 0
4. WHEN displaying change percentages THEN the system SHALL round to 2 decimal places maximum

### Requirement 5

**User Story:** As a system administrator, I want to ensure that the lesson counting mechanism is accurate and auditable, so that billing and usage tracking are reliable.

#### Acceptance Criteria

1. WHEN an interactive material is successfully created THEN the system SHALL create an auditable record with timestamp, tutor_id, sub_topic_id, and lesson_id
2. WHEN calculating dashboard metrics THEN the system SHALL use only successfully completed interactive material creations
3. WHEN a tutor account is accessed THEN the metrics SHALL be calculated in real-time from the database, not from cached values
4. WHEN interactive material creation fails partway through THEN no count increment SHALL occur and any partial records SHALL be cleaned up
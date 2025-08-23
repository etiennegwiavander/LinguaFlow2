# Requirements Document

## Introduction

The Discussion Topics and Questions feature will provide an interactive way for students to practice conversational skills through personalized discussion topics and questions. This feature will appear as a new sidebar option in the student profile, offering gamified flashcard-style questions that adapt to each student's proficiency level. The feature aims to enhance conversational fluency by providing structured discussion practice with meaningful, level-appropriate questions.

## Requirements

### Requirement 1

**User Story:** As a tutor, I want to access a discussion topics section from the student's profile sidebar, so that I can provide structured conversation practice for my students.

#### Acceptance Criteria

1. WHEN a tutor is viewing a student's profile THEN the system SHALL display a "Discussion Topics" option in the sidebar navigation
2. WHEN the tutor clicks on "Discussion Topics" THEN the system SHALL navigate to a dedicated discussion topics page for that student
3. IF the student profile is loaded THEN the discussion topics link SHALL be visible and accessible in the sidebar

### Requirement 2

**User Story:** As a tutor, I want to see a list of available discussion topics with an input field to create custom topics, so that I can choose relevant conversation starters for my student.

#### Acceptance Criteria

1. WHEN the discussion topics page loads THEN the system SHALL display a list of pre-generated discussion topics appropriate for the student's level
2. WHEN the page loads THEN the system SHALL display an input field for creating custom discussion topics
3. WHEN a tutor enters a custom topic in the input field THEN the system SHALL add it to the available topics list
4. WHEN topics are displayed THEN each topic SHALL be clearly labeled and selectable
5. IF the student's level is available THEN the system SHALL filter topics to match their proficiency level

### Requirement 3

**User Story:** As a tutor, I want to select a discussion topic and see individual questions displayed as flashcards, so that I can guide my student through structured conversation practice.

#### Acceptance Criteria

1. WHEN a tutor selects a discussion topic THEN the system SHALL display questions in a flashcard format
2. WHEN flashcards are displayed THEN the system SHALL blur the background/other sections of the screen
3. WHEN a flashcard is active THEN only one question SHALL be visible at a time
4. WHEN flashcards are shown THEN the system SHALL provide forward and backward navigation arrows
5. WHEN navigation arrows are clicked THEN the system SHALL smoothly transition between questions

### Requirement 4

**User Story:** As a tutor, I want each discussion topic to contain at least 20 meaningful questions personalized to my student's level, so that I have sufficient content for comprehensive conversation practice.

#### Acceptance Criteria

1. WHEN a discussion topic is generated THEN the system SHALL create at least 20 questions for that topic that don't repeat.
2. WHEN questions are created THEN each question SHALL be meaningful and relevant to the discussion topic
3. WHEN questions are generated THEN they SHALL be personalized to the student's proficiency level
4. IF the student's level is beginner THEN questions SHALL use simple vocabulary and sentence structures
5. IF the student's level is intermediate or advanced THEN questions SHALL include more complex language and concepts

### Requirement 5

**User Story:** As a tutor, I want the flashcard interface to provide a gamified experience, so that conversation practice feels engaging and interactive for my student.

#### Acceptance Criteria

1. WHEN flashcards are displayed THEN the system SHALL provide smooth animations and transitions
2. WHEN navigating between questions THEN the system SHALL show visual feedback for user interactions
3. WHEN a flashcard is active THEN the system SHALL highlight the current question prominently
4. WHEN the flashcard interface is open THEN the system SHALL provide an immersive, focused experience
5. WHEN users interact with navigation controls THEN the system SHALL provide immediate visual response

### Requirement 6

**User Story:** As a tutor, I want to easily exit the flashcard mode and return to the topic selection, so that I can switch between different discussion topics during a lesson.

#### Acceptance Criteria

1. WHEN flashcards are displayed THEN the system SHALL provide a clear way to exit flashcard mode
2. WHEN the exit option is used THEN the system SHALL return to the discussion topics list
3. WHEN returning to topics list THEN the system SHALL maintain the current session state
4. WHEN switching topics THEN the system SHALL preserve any custom topics that were added
5. IF a user exits flashcard mode THEN the background blur SHALL be removed and normal navigation SHALL be restored
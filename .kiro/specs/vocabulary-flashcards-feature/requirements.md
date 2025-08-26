# Requirements Document

## Introduction

The Vocabulary Flashcards feature will provide an interactive way for students to learn and practice vocabulary through personalized flashcards that adapt to each student's proficiency level and learning needs. This feature will appear as a new sidebar option in the student profile, offering gamified flashcard-style vocabulary learning with comprehensive word information including pronunciation, definitions, parts of speech, and example sentences across different tenses. The feature aims to enhance vocabulary acquisition by providing structured, personalized vocabulary practice with infinite, non-repeating content.

## Requirements

### Requirement 1

**User Story:** As a tutor, I want to access a vocabulary flashcards section from the student's profile sidebar, so that I can provide structured vocabulary practice for my students.

#### Acceptance Criteria

1. WHEN a tutor is viewing a student's profile THEN the system SHALL display a "Vocabulary Flashcards" option in the sidebar navigation
2. WHEN the tutor clicks on "Vocabulary Flashcards" THEN the system SHALL navigate to a dedicated vocabulary flashcards page for that student
3. IF the student profile is loaded THEN the vocabulary flashcards link SHALL be visible and accessible in the sidebar

### Requirement 2

**User Story:** As a tutor, I want the system to generate infinite and non-repeating vocabulary words personalized to my student's profile, so that I can provide continuous vocabulary learning without content exhaustion.

#### Acceptance Criteria

1. WHEN the vocabulary flashcards page loads THEN the system SHALL generate vocabulary words based on the student's proficiency level and learning profile
2. WHEN vocabulary words are generated THEN the system SHALL ensure no word is repeated within the same session
3. WHEN a student has seen all words at their level THEN the system SHALL generate new words that build upon their existing vocabulary
4. WHEN words are selected THEN they SHALL be personalized to address the student's specific vocabulary learning needs
5. IF the student's profile indicates specific vocabulary weaknesses THEN the system SHALL prioritize words that address those areas

### Requirement 3

**User Story:** As a tutor, I want each vocabulary flashcard to display comprehensive word information including pronunciation, definition, part of speech, and example sentences, so that students get complete vocabulary learning context.

#### Acceptance Criteria

1. WHEN a vocabulary flashcard is displayed THEN the system SHALL show the vocabulary word prominently
2. WHEN a flashcard is shown THEN the system SHALL display the phonetic pronunciation of the word
3. WHEN a flashcard is displayed THEN the system SHALL show the word's definition
4. WHEN a flashcard is shown THEN the system SHALL indicate the part of speech (noun, verb, adjective, etc.)
5. WHEN a flashcard is displayed THEN the system SHALL provide example sentences for the vocabulary word

### Requirement 4

**User Story:** As a tutor, I want example sentences to be categorized by tense (present, past, future, present perfect, past perfect, future perfect) with the vocabulary word highlighted, so that students understand how to use the word in different temporal contexts.

#### Acceptance Criteria

1. WHEN example sentences are displayed THEN the system SHALL provide sentences in present tense, past tense, future tense, present perfect tense, past perfect tense, and future perfect tense
2. WHEN example sentences are shown THEN each sentence SHALL have a different meaning while containing the vocabulary word
3. WHEN the vocabulary word appears in sentences THEN it SHALL be displayed in bold formatting
4. WHEN sentences are categorized by tense THEN each tense category SHALL be clearly labeled
5. WHEN multiple sentences are provided THEN they SHALL demonstrate varied usage contexts for the vocabulary word

### Requirement 5

**User Story:** As a tutor, I want flashcard navigation with forward and backward arrows and "last memory" functionality, so that I can control the pace of learning and return to where we left off in previous sessions.

#### Acceptance Criteria

1. WHEN flashcards are displayed THEN the system SHALL provide forward and backward navigation arrows
2. WHEN the forward arrow is clicked THEN the system SHALL display the next vocabulary word
3. WHEN the backward arrow is clicked THEN the system SHALL display the previous vocabulary word
4. WHEN a tutoring session ends THEN the system SHALL remember the last flashcard position
5. WHEN a new session begins THEN the system SHALL provide an option to "Continue from last memory" to resume from the previous position
6. WHEN "last memory" is selected THEN the system SHALL load the flashcard where the previous session ended

### Requirement 6

**User Story:** As a tutor, I want the flashcard interface to provide a gamified and immersive experience, so that vocabulary learning feels engaging and focused for my student.

#### Acceptance Criteria

1. WHEN flashcards are displayed THEN the system SHALL provide smooth animations and transitions between cards
2. WHEN navigating between flashcards THEN the system SHALL show visual feedback for user interactions
3. WHEN a flashcard is active THEN the system SHALL blur the background to create focus
4. WHEN the flashcard interface is open THEN the system SHALL provide an immersive, distraction-free experience
5. WHEN users interact with navigation controls THEN the system SHALL provide immediate visual response

### Requirement 7

**User Story:** As a tutor, I want to easily exit the flashcard mode and return to the main interface, so that I can switch between vocabulary practice and other learning activities during a lesson.

#### Acceptance Criteria

1. WHEN flashcards are displayed THEN the system SHALL provide a clear way to exit flashcard mode
2. WHEN the exit option is used THEN the system SHALL return to the student profile interface
3. WHEN exiting flashcard mode THEN the system SHALL save the current session progress
4. WHEN returning to the interface THEN the system SHALL maintain the current session state for future access
5. IF a user exits flashcard mode THEN the background blur SHALL be removed and normal navigation SHALL be restored

### Requirement 8

**User Story:** As a tutor, I want the vocabulary selection to be deeply personalized based on the student's learning profile, so that the vocabulary practice addresses their specific learning needs and challenges.

#### Acceptance Criteria

1. WHEN vocabulary words are generated THEN the system SHALL analyze the student's proficiency level to select appropriate difficulty
2. WHEN words are selected THEN the system SHALL consider the student's native language to avoid cognates when beneficial
3. WHEN vocabulary is generated THEN the system SHALL prioritize words that address the student's stated learning goals
4. WHEN the student has identified vocabulary weaknesses THEN the system SHALL focus on words that strengthen those areas
5. IF the student's conversational barriers are vocabulary-related THEN the system SHALL prioritize words that address those specific barriers
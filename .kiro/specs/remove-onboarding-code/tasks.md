# Implementation Plan

- [x] 1. Fix TypeScript build error in StudentProfileClient.tsx


  - Remove undefined `showOnboarding` variable reference that causes build failure
  - Remove the conditional "New!" badge and Lightbulb icon from AI Lesson Architect tab
  - Clean up unused Lightbulb import if no longer needed
  - _Requirements: 1.1, 1.4, 2.1_

- [x] 2. Remove onboarding-related backup files






  - Delete StudentProfileClient-backup.tsx file that contains onboarding state variables
  - Verify no other backup files contain onboarding references
  - _Requirements: 1.1, 1.4_

- [x] 3. Verify build success and deployment readiness











  - Run TypeScript build to confirm no onboarding-related errors
  - Test that AI Lesson Architect tab displays cleanly without onboarding elements
  - Verify all core functionality works without onboarding interruptions
  - _Requirements: 1.1, 1.2, 2.2, 3.1, 3.2_

- [x] 4. Clean up any remaining onboarding references











  - Search codebase for any other onboarding-related code patterns
  - Remove any unused imports related to onboarding functionality
  - Verify no runtime errors occur from missing onboarding functionality
  - _Requirements: 1.2, 1.4, 3.3_

- [x] 5. Final validation and testing




  - Perform end-to-end test of student profile functionality
  - Verify lesson generation workflow works without onboarding elements
  - Test deployment to ensure production readiness
  - _Requirements: 2.2, 2.3, 3.2, 3.3, 3.4_

# Sidebar Auto-Collapse Feature

## Overview
Implemented automatic sidebar collapse when users select a discussion topic to provide more screen real estate for the flashcard interface and discussion questions.

## Implementation Details

### 1. Sidebar Context System
Created a centralized sidebar state management system using React Context:

**File: `lib/sidebar-context.tsx`**
- `SidebarProvider`: Provides sidebar state to the entire app
- `useSidebar`: Hook to access sidebar controls from any component
- Functions:
  - `collapseSidebar()`: Collapses sidebar (desktop only)
  - `expandSidebar()`: Expands sidebar (desktop only)
  - `setSidebarCollapsed()`: Direct state control
- Mobile-aware: Prevents collapse/expand on mobile devices

### 2. MainLayout Integration
Updated `components/main-layout.tsx`:
- Wrapped content with `SidebarProvider`
- Removed local sidebar state management
- Uses context for sidebar state

### 3. Sidebar Component Updates
Updated `components/layout/Sidebar.tsx`:
- Uses `useSidebar` hook instead of local state
- Maintains existing toggle functionality
- Responsive behavior preserved

### 4. Discussion Topics Integration
Updated `components/students/DiscussionTopicsTab.tsx`:
- Added `useSidebar` hook
- Calls `collapseSidebar()` when topic is selected
- Automatic collapse happens before flashcard interface opens

## User Experience Flow

1. **Initial State**: Sidebar is expanded (desktop) or collapsed (mobile)
2. **Topic Selection**: User clicks on a discussion topic
3. **Auto-Collapse**: Sidebar automatically collapses (desktop only)
4. **Flashcard Display**: Questions appear with maximum screen space
5. **Manual Control**: Users can still manually expand/collapse sidebar

## Benefits

### More Screen Space
- Flashcard interface gets additional ~180px width when sidebar collapses
- Better readability for discussion questions
- Improved mobile-like experience on desktop

### Seamless UX
- Automatic behavior reduces manual steps
- Maintains user control with manual toggle
- Responsive design considerations

### Performance
- Context-based state management
- No prop drilling required
- Efficient re-renders

## Technical Features

### Mobile Responsiveness
- Auto-collapse only works on desktop (width >= 768px)
- Mobile devices maintain existing behavior
- Prevents unwanted sidebar behavior on small screens

### State Persistence
- Sidebar state persists across component re-renders
- Context survives navigation within the app
- Maintains collapsed state until manually changed

### Accessibility
- Existing keyboard navigation preserved
- Screen reader compatibility maintained
- Focus management unaffected

## Code Examples

### Using the Sidebar Context
```typescript
import { useSidebar } from "@/lib/sidebar-context";

function MyComponent() {
  const { collapseSidebar, expandSidebar, sidebarCollapsed } = useSidebar();
  
  const handleAction = () => {
    // Collapse sidebar for better view
    collapseSidebar();
  };
  
  return (
    <button onClick={handleAction}>
      Start Activity
    </button>
  );
}
```

### Context Provider Setup
```typescript
// In MainLayout
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
```

## Future Enhancements

### Smart Auto-Expand
- Auto-expand sidebar when returning to topic list
- Context-aware expansion based on user activity

### User Preferences
- Remember user's preferred sidebar behavior
- Settings to enable/disable auto-collapse

### Animation Improvements
- Smoother transitions during auto-collapse
- Coordinated animations with flashcard interface

### Activity-Based Collapse
- Auto-collapse for other full-screen activities
- Lesson material display
- Interactive exercises

## Testing Considerations

### Manual Testing
1. Select discussion topic → Verify sidebar collapses
2. Manual toggle → Verify still works
3. Mobile device → Verify no auto-collapse
4. Window resize → Verify responsive behavior

### Edge Cases
- Rapid topic selection
- Sidebar already collapsed
- Mobile orientation changes
- Context provider missing

## Conclusion
The sidebar auto-collapse feature enhances the discussion topics experience by automatically optimizing screen space when users engage with flashcard questions. The implementation uses React Context for clean state management and maintains full backward compatibility with existing sidebar functionality.
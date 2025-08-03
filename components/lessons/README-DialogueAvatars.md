# Dialogue Avatar Enhancement System

## Overview

The Dialogue Avatar Enhancement System replaces simple initial-based avatars in dialogue sections with visual character avatars that reflect personality traits and roles. The system uses the tutor's profile image for teacher/tutor characters and generates appropriate character avatars for other dialogue participants.

## Components

### 1. DialogueAvatar Component (`components/lessons/DialogueAvatar.tsx`)

The main avatar component that renders visual avatars based on character roles and context.

**Props:**
- `character: string` - The character's name
- `isTeacher?: boolean` - Whether this character is a teacher/tutor
- `role?: string` - Optional explicit role override
- `size?: 'sm' | 'md' | 'lg'` - Avatar size (default: 'sm')
- `className?: string` - Additional CSS classes

**Features:**
- **Tutor Profile Images**: Uses actual tutor profile images for teacher characters
- **Role-based Avatar Generation**: Generates appropriate avatars using DiceBear API based on character roles
- **Intelligent Role Detection**: Automatically detects character roles from names and context
- **Performance Optimization**: Caches generated avatars for 30 minutes
- **Graceful Fallbacks**: Falls back to icon-based avatars if generation fails
- **Responsive Sizing**: Supports multiple size variants

### 2. useDialogueAvatars Hook (`hooks/useDialogueAvatars.ts`)

A custom hook that manages avatar caching, character role detection, and consistency.

**Functions:**
- `getCharacterInfo(character: string)` - Returns character information including role and avatar URL
- `preloadAvatars(characters: string[])` - Preloads avatars for better performance
- `clearCache()` - Clears the character role cache

**Features:**
- **Consistent Role Detection**: Maintains same role for same character throughout session
- **Priority-based Pattern Matching**: Uses weighted patterns for accurate role detection
- **Avatar Preloading**: Preloads avatars when lesson content loads

### 3. Integration with LessonMaterialDisplay

The avatar system is integrated into the dialogue rendering sections:
- `full_dialogue` case
- `fill_in_the_blanks_dialogue` case

## Role Detection System

### Supported Roles

1. **Teacher** - Teachers, tutors, instructors, professors
   - Avatar: Professional personas style
   - Uses tutor's actual profile image when available
   - Color scheme: Green

2. **Student** - Students, learners, pupils
   - Avatar: Friendly adventurer style
   - Color scheme: Blue

3. **Doctor** - Medical professionals
   - Avatar: Professional personas style
   - Color scheme: Red

4. **Customer** - Customers, clients, buyers
   - Avatar: Casual micah style
   - Color scheme: Purple

5. **Friend** - Friends, buddies, pals
   - Avatar: Warm fun-emoji style
   - Color scheme: Yellow

6. **Family** - Family members (mom, dad, sister, etc.)
   - Avatar: Warm fun-emoji style
   - Color scheme: Pink

7. **Professional** - Managers, colleagues, employees
   - Avatar: Professional personas style
   - Color scheme: Gray

8. **Service** - Service workers (waiters, cashiers, etc.)
   - Avatar: Casual micah style
   - Color scheme: Orange

### Detection Patterns

The system uses regex patterns with priority weights to detect character roles:

```typescript
const ROLE_DETECTION = {
  teacher: {
    patterns: [
      /^(teacher|tutor|instructor|professor|educator|mr\.|mrs\.|ms\.|dr\.)/i,
      /teacher|tutor|instructor|professor|educator/i
    ],
    priority: 10
  },
  // ... other roles
};
```

## Avatar Generation

### DiceBear API Integration

The system uses the DiceBear API (https://api.dicebear.com) to generate consistent, role-appropriate avatars:

- **Personas**: Professional-looking avatars for teachers, doctors, professionals
- **Adventurer**: Friendly, approachable avatars for students
- **Micah**: Casual avatars for customers and service workers
- **Fun-emoji**: Warm, friendly avatars for friends and family
- **Initials**: Fallback style for unknown roles

### Caching Strategy

- **In-memory caching**: Avatars are cached for 30 minutes per session
- **Character consistency**: Same character always gets the same avatar
- **Performance optimization**: Preloading of avatars when lesson content loads
- **Error handling**: Graceful fallback to icon-based avatars

## Usage Examples

### Basic Usage

```tsx
<DialogueAvatar
  character="Teacher Smith"
  isTeacher={true}
  size="sm"
/>
```

### With Role Override

```tsx
<DialogueAvatar
  character="Dr. Johnson"
  role="doctor"
  size="md"
/>
```

### In Dialogue Context

```tsx
const characterInfo = getCharacterInfo(character);

<DialogueAvatar
  character={character}
  isTeacher={characterInfo.isTeacher}
  role={characterInfo.role}
  size="sm"
/>
```

## Performance Considerations

1. **Avatar Preloading**: Avatars are preloaded when lesson content is available
2. **Caching**: Generated avatars are cached to avoid redundant API calls
3. **Lazy Loading**: Avatars are only generated when needed
4. **Error Handling**: Failed avatar loads don't break the dialogue display
5. **Fallback System**: Multiple fallback levels ensure avatars always display

## Fallback Hierarchy

1. **Tutor Profile Image** (for teachers with uploaded photos)
2. **Generated Avatar** (DiceBear API based on role)
3. **Icon-based Avatar** (role-appropriate icons with colors)
4. **Default Avatar** (generic user icon)

## Testing

Use the `DialogueAvatarTest` component to verify the avatar system:

```tsx
import DialogueAvatarTest from '@/components/lessons/DialogueAvatarTest';

// Render in your test environment
<DialogueAvatarTest />
```

## Requirements Compliance

✅ **Requirement 1**: Visual character avatars replace initial-based avatars
✅ **Requirement 2**: Avatars reflect personality traits and roles
✅ **Requirement 3**: Seamless integration with existing dialogue functionality
✅ **Requirement 4**: Performance optimization and graceful fallbacks

## Future Enhancements

1. **Custom Avatar Upload**: Allow tutors to upload custom character avatars
2. **AI-Generated Avatars**: Use AI to generate more contextually appropriate avatars
3. **Animation Support**: Add subtle animations for enhanced engagement
4. **Accessibility**: Improve screen reader support and alt text
5. **Localization**: Support for different cultural avatar styles
# Dashboard Calendar Events Fix

## Problem Identified
Calendar events were disappearing immediately when the lesson time started, instead of persisting for 75% of the lesson duration. Additionally, there was no "Ongoing" indicator for active lessons.

## Root Cause
The dashboard query was filtering events with `gte('start_time', now.toISOString())`, which excluded any events that had already started.

## Solution Implemented

### 1. Extended Query Time Window
**Before:**
```typescript
.gte('start_time', now.toISOString()) // Only future events
```

**After:**
```typescript
const fortyEightHoursAgo = addHours(now, -48);
.gte('start_time', fortyEightHoursAgo.toISOString()) // Include past events
```

This allows the query to fetch events that started in the past but are still ongoing.

### 2. Added 75% Visibility Logic
Implemented the same `getEventStatus()` function from the calendar page:

```typescript
const getEventStatus = (event: CalendarEvent) => {
  const eventStart = parseISO(event.start_time);
  const eventEnd = parseISO(event.end_time);
  
  // Calculate 75% point of the event duration
  const eventDuration = eventEnd.getTime() - eventStart.getTime();
  const threeQuarterPoint = new Date(eventStart.getTime() + (eventDuration * 0.75));
  
  if (currentTime < eventStart) {
    return { status: 'upcoming', visible: true };
  } else if (currentTime >= eventStart && currentTime < threeQuarterPoint) {
    return { status: 'ongoing', visible: true };
  } else {
    return { status: 'completed', visible: false };
  }
};
```

### 3. Added Real-Time Updates
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Update every minute

  return () => clearInterval(interval);
}, []);
```

### 4. Added "Ongoing" Indicator
Events now show an orange badge with a pulsing dot when they're in progress:

```typescript
{isOngoing ? (
  <Badge variant="secondary" className="text-xs ml-2 bg-orange-100 text-orange-800">
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
      <span>Ongoing</span>
    </div>
  </Badge>
) : ...}
```

### 5. Updated Event Card Styling
Ongoing events now have orange highlighting:

```typescript
className={`cyber-card p-4 rounded-lg cursor-pointer hover-lift ${
  isOngoing ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10' :
  timeInfo.isToday ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' :
  timeInfo.isTomorrow ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : ''
}`}
```

### 6. Filtered Display
Events are now filtered before display to only show visible ones:

```typescript
const visibleEvents = calendarEvents
  .map(event => ({
    ...event,
    eventStatus: getEventStatus(event)
  }))
  .filter(event => event.eventStatus.visible);
```

## Behavior After Fix

### Example: 1-Hour Lesson (10:00 AM - 11:00 AM)

| Time | Dashboard Status | Visibility | Badge |
|------|------------------|------------|-------|
| 9:00 AM | Upcoming | ✅ Visible | "Today" (if today) |
| 10:00 AM | **Ongoing** | ✅ Visible | **"Ongoing" (orange, pulsing)** |
| 10:30 AM | **Ongoing** | ✅ Visible | **"Ongoing" (orange, pulsing)** |
| 10:45 AM | **Disappears** (75% mark) | ❌ Hidden | - |
| 11:00 AM | Hidden | ❌ Hidden | - |

### Example: 2-Hour Lesson (2:00 PM - 4:00 PM)

| Time | Dashboard Status | Visibility | Duration Visible |
|------|------------------|------------|------------------|
| 1:00 PM | Upcoming | ✅ Visible | - |
| 2:00 PM | **Ongoing** | ✅ Visible | Starts |
| 3:00 PM | **Ongoing** | ✅ Visible | 1 hour in |
| 3:30 PM | **Disappears** | ❌ Hidden | **Visible for 90 minutes (75%)** |
| 4:00 PM | Hidden | ❌ Hidden | - |

## Consistency with Calendar Page

Both pages now use the same logic:
- ✅ Events visible until 75% of duration
- ✅ "Ongoing" indicator with orange styling
- ✅ Real-time updates every 60 seconds
- ✅ Pulsing badge for active lessons

## Files Modified
- `app/dashboard/page.tsx`

## Changes Made
1. Added `currentTime` state for real-time tracking
2. Extended query to include past events (48 hours back)
3. Added `getEventStatus()` helper function
4. Added real-time update interval (60 seconds)
5. Filtered events by visibility before display
6. Added "Ongoing" badge with pulsing animation
7. Updated card styling for ongoing events
8. Updated empty state condition

## Testing
- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Events now persist during lesson time
- ✅ "Ongoing" indicator appears for active lessons
- ✅ Events disappear at 75% mark
- ✅ Real-time updates every minute

## Result
Dashboard calendar events now behave consistently with the calendar page, showing ongoing lessons with a clear visual indicator and disappearing at the appropriate time (75% of lesson duration).

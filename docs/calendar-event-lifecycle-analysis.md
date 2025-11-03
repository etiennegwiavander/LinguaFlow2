# Google Calendar Event Lifecycle Analysis

## Executive Summary

This document provides a deep analysis of how Google Calendar synced lessons are displayed and when they disappear from the tutor's dashboard and calendar page.

## Event Visibility Logic

### Calendar Page (`app/calendar/page.tsx`)

#### Time Window
- **Fetch Range**: Events from **NOW** to **2 weeks in the future**
- **Query**: `getCalendarEvents(now, twoWeeksFromNow)`

#### Visibility Calculation
The `getEventStatus()` function determines if an event should be visible:

```typescript
const getEventStatus = (event: CalendarEvent) => {
  const eventStart = parseISO(event.start_time);
  const eventEnd = parseISO(event.end_time);
  
  // Calculate 3/4 point of the event duration
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

#### Event States

1. **Upcoming** (visible: ✅)
   - Condition: `currentTime < eventStart`
   - Display: Normal card with date/time
   - Badge: "Today" or "Tomorrow" if applicable

2. **Ongoing** (visible: ✅)
   - Condition: `currentTime >= eventStart AND currentTime < threeQuarterPoint`
   - Display: Orange highlighted card
   - Badge: "Ongoing..." with pulsing dot
   - Duration: Visible until **75% of lesson duration** has passed

3. **Completed** (visible: ❌)
   - Condition: `currentTime >= threeQuarterPoint`
   - Display: Hidden from view
   - Duration: Disappears after **75% of lesson duration**

#### Real-Time Updates
- **Update Frequency**: Every 60 seconds (1 minute)
- **Mechanism**: `setInterval` updates `currentTime` state
- **Effect**: Events automatically transition between states and disappear when reaching 75% completion

### Dashboard Page (`app/dashboard/page.tsx`)

#### Time Window
- **Fetch Range**: Events from **NOW** to **48 hours in the future**
- **Query**: 
  ```typescript
  const now = new Date();
  const fortyEightHoursFromNow = addHours(now, 48);
  ```

#### Visibility Logic
- **No explicit filtering**: All events within 48-hour window are shown
- **No ongoing/completed logic**: Events remain visible until they fall outside the 48-hour window
- **Automatic refresh**: Every 30 minutes

#### Event Display
- Shows event summary, date, time, location
- Highlights "Today" and "Tomorrow" events
- Clickable to navigate to student profile
- No "ongoing" or "completed" states

## Detailed Lifecycle Timeline

### Example: 1-Hour Lesson (10:00 AM - 11:00 AM)

| Time | Calendar Page Status | Dashboard Status | Visibility |
|------|---------------------|------------------|------------|
| 9:00 AM | Upcoming | Visible | Both pages show event |
| 10:00 AM | Ongoing (starts) | Visible | Orange highlight on calendar page |
| 10:15 AM | Ongoing | Visible | Still visible on both |
| 10:30 AM | Ongoing | Visible | Still visible on both |
| 10:45 AM | **Disappears** (75% mark) | Visible | Hidden from calendar page |
| 11:00 AM | Hidden | Visible | Only on dashboard (if within 48h) |
| 2 days later | Hidden | **Disappears** | Hidden from both |

### Example: 2-Hour Lesson (2:00 PM - 4:00 PM)

| Time | Calendar Page Status | Dashboard Status | Duration Visible |
|------|---------------------|------------------|------------------|
| 1:00 PM | Upcoming | Visible | - |
| 2:00 PM | Ongoing (starts) | Visible | - |
| 3:00 PM | Ongoing | Visible | 1 hour into lesson |
| 3:30 PM | **Disappears** (75% = 1.5h) | Visible | **Disappears at 90 min mark** |
| 4:00 PM | Hidden | Visible | - |

## Key Findings

### Calendar Page Behavior

1. **Disappearance Timing**: Events disappear when **75% of the lesson duration** has elapsed
   - 1-hour lesson: Disappears after 45 minutes
   - 2-hour lesson: Disappears after 1.5 hours
   - 30-minute lesson: Disappears after 22.5 minutes

2. **Rationale**: This allows tutors to see ongoing lessons for most of their duration, but removes them before completion to keep the view clean

3. **Update Frequency**: Every 60 seconds, so events may remain visible for up to 1 minute past the 75% threshold

### Dashboard Behavior

1. **Disappearance Timing**: Events disappear when they fall outside the **48-hour window**
   - No consideration for lesson completion
   - Events remain visible even after they've ended
   - Only removed when `start_time < (now - 48 hours)`

2. **Rationale**: Dashboard shows a broader view of recent and upcoming events

3. **Update Frequency**: Every 30 minutes via automatic refresh

## Comparison: Calendar vs Dashboard

| Feature | Calendar Page | Dashboard |
|---------|--------------|-----------|
| Time Window | 2 weeks future | 48 hours future |
| Ongoing Detection | ✅ Yes (orange highlight) | ❌ No |
| Disappearance Logic | 75% of duration | Outside 48h window |
| Real-time Updates | Every 60 seconds | Every 30 minutes |
| Event States | Upcoming, Ongoing, Completed | All visible |
| Purpose | Detailed calendar view | Quick overview |

## Potential Issues & Recommendations

### Issue 1: Inconsistent Behavior
**Problem**: Events disappear from calendar page at 75% but remain on dashboard until 48 hours pass

**Impact**: Tutors may see different information on different pages

**Recommendation**: Consider synchronizing the logic or clearly documenting the difference

### Issue 2: Dashboard Shows Past Events
**Problem**: Dashboard shows events that have already ended (as long as they're within 48 hours)

**Impact**: May clutter the dashboard with completed lessons

**Recommendation**: Add filtering to hide events that have ended:
```typescript
.gte('end_time', now.toISOString()) // Only show events that haven't ended yet
```

### Issue 3: 75% Threshold May Be Too Early
**Problem**: For long lessons (2+ hours), events disappear while still in progress

**Impact**: Tutors lose visibility of ongoing lessons before they finish

**Recommendation**: Consider alternative thresholds:
- Option A: Disappear at 90% (more time visible)
- Option B: Disappear at event end time
- Option C: Disappear 15 minutes after event end time

### Issue 4: No Visual Indicator on Dashboard
**Problem**: Dashboard doesn't show which events are currently ongoing

**Impact**: Tutors can't quickly identify active lessons

**Recommendation**: Add "Ongoing" badge to dashboard events similar to calendar page

## Code Locations

### Calendar Page Event Filtering
- **File**: `app/calendar/page.tsx`
- **Function**: `getEventStatus()` (lines ~260-275)
- **Filter**: `upcomingEvents` (lines ~278-282)

### Dashboard Event Fetching
- **File**: `app/dashboard/page.tsx`
- **Function**: `fetchCalendarEvents()` (lines ~50-70)
- **Query**: Lines ~55-62

### Real-time Update Intervals
- **Calendar Page**: Line ~100 (60-second interval)
- **Dashboard**: Line ~220 (30-minute interval)

## Summary

**Calendar Page**: Events disappear after **75% of lesson duration** has elapsed, with real-time updates every 60 seconds.

**Dashboard**: Events disappear when they fall outside the **48-hour window**, with updates every 30 minutes.

This creates a two-tier system where the calendar page provides detailed, real-time lesson tracking, while the dashboard offers a broader overview of recent and upcoming events.

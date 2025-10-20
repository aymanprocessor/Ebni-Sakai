# Trial Badge Alert Style Update

## Summary
Updated the trial badge to use PrimeNG alert/message styles with sticky positioning and top margin.

## Changes Made

### 1. ✅ PrimeNG Alert Styling
- **Success Alert (Green)**: When trial has more than 3 days remaining
  - Icon: `pi pi-check-circle`
  - Colors: Green theme (`--green-50`, `--green-500`, `--green-900`)
  - Border: 4px solid green on the left
  
- **Warning Alert (Orange)**: When trial has 3 days or less remaining
  - Icon: `pi pi-exclamation-triangle`
  - Colors: Orange theme (`--orange-50`, `--orange-500`, `--orange-900`)
  - Border: 4px solid orange on the left

### 2. ✅ Sticky Positioning with Margin
- Badge is now **sticky** (fixed position) below the topbar
- **Top margin**: 0.5rem from topbar (positioned at `4.5rem` from top)
- **Z-index**: 996 (below topbar at 997, above content)
- Stays visible when scrolling
- Centered horizontally on the page

### 3. ✅ Enhanced Interactions
- **Hover effect**: Slight lift with enhanced shadow
- **Focus visible**: Clear outline for keyboard navigation
- **Smooth transitions**: 0.2s ease on all interactions
- **Box shadow**: Subtle elevation effect

### 4. ✅ Mobile Responsive
- On mobile: Shows "•••" (3 dots) instead of full text
- Reduced padding for compact display
- Adjusted top position for mobile (4.25rem)
- Maintains alert styling and colors

### 5. ✅ Dark Mode Support
- Success alert in dark mode:
  - Background: `rgba(34, 197, 94, 0.15)` (semi-transparent green)
  - Text/Icon: `--green-400`
  - Border: `--green-400`
  
- Warning alert in dark mode:
  - Background: `rgba(251, 146, 60, 0.15)` (semi-transparent orange)
  - Text/Icon: `--orange-400`
  - Border: `--orange-400`

## Files Modified

### 1. `src/app/layout/component/app.topbar.ts`
```typescript
// Changed class names and structure
<div class="center-trial-badge-sticky">
    <button class="trial-badge-alert"
            [ngClass]="days <= 3 ? 'p-message p-message-warn' : 'p-message p-message-success'">
        <div class="p-message-wrapper">
            <i [class]="days <= 3 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
            <span class="trial-badge-text">{{ text }}</span>
            <span class="trial-badge-dots">•••</span>
        </div>
    </button>
</div>
```

### 2. `src/assets/layout/_topbar.scss`
- Added `.center-trial-badge-sticky` styles with fixed positioning
- Added `.trial-badge-alert` with PrimeNG message integration
- Success state styling with green colors
- Warning state styling with orange colors
- Dark mode support for both states
- Mobile responsive adjustments

## Visual Design

### Desktop View (More than 3 days)
```
┌─────────────────────────────────────────┐
│         [Topbar - 4rem height]          │
└─────────────────────────────────────────┘
              ↓ 0.5rem margin ↓
┌─────────────────────────────────────────┐
│ ✓ 10 days left                          │ ← Green success alert
└─────────────────────────────────────────┘
```

### Desktop View (3 days or less)
```
┌─────────────────────────────────────────┐
│         [Topbar - 4rem height]          │
└─────────────────────────────────────────┘
              ↓ 0.5rem margin ↓
┌─────────────────────────────────────────┐
│ ⚠ 2 days left                           │ ← Orange warning alert
└─────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────┐
│      [Topbar]       │
└─────────────────────┘
    ↓ 0.25rem ↓
┌─────────────────────┐
│    ✓ •••            │ ← Success (dots)
└─────────────────────┘
```

## Benefits

1. **Professional Appearance**: Uses consistent PrimeNG design system
2. **Better Visibility**: Sticky positioning keeps alert always visible
3. **Clear Status Indication**: Green for safe, orange for urgent
4. **Accessibility**: 
   - Icon indicators
   - Color contrast compliance
   - Keyboard navigation support
5. **Responsive**: Adapts to all screen sizes
6. **Dark Mode Ready**: Proper contrast in both light and dark themes
7. **Interactive**: Hover effects and smooth transitions

## Color Reference

### Light Mode
- **Success**: 
  - Background: `--green-50` (very light green)
  - Text: `--green-900` (dark green)
  - Icon/Border: `--green-500` (medium green)

- **Warning**: 
  - Background: `--orange-50` (very light orange)
  - Text: `--orange-900` (dark orange)
  - Icon/Border: `--orange-500` (medium orange)

### Dark Mode
- **Success**: 
  - Background: `rgba(34, 197, 94, 0.15)` (15% opacity green)
  - Text/Icon/Border: `--green-400` (lighter green)

- **Warning**: 
  - Background: `rgba(251, 146, 60, 0.15)` (15% opacity orange)
  - Text/Icon/Border: `--orange-400` (lighter orange)

## Accessibility Features

- ✅ ARIA labels for screen readers
- ✅ Focus visible outline
- ✅ Color is not the only indicator (icons used)
- ✅ Sufficient color contrast ratios
- ✅ Keyboard accessible (clickable button)
- ✅ Semantic HTML structure

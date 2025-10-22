# WhatsApp Button Component

A clean, modern floating WhatsApp chat button for Angular applications.

## Features

- ✅ Fixed position at bottom-right corner (responsive)
- ✅ WhatsApp green color (#25D366)
- ✅ Smooth hover effects (scale + shadow)
- ✅ Font Awesome WhatsApp icon
- ✅ Opens WhatsApp in new tab
- ✅ Fully responsive (desktop, tablet, mobile)
- ✅ RTL support for Arabic
- ✅ Accessibility features (aria-label, focus states)
- ✅ Standalone Angular component

## Installation

The component is already installed and integrated into your application.

### Files Created:
```
src/app/shared/components/whatsapp-button/
├── whatsapp-button.component.ts
├── whatsapp-button.component.html
└── whatsapp-button.component.scss
```

### Integration:
The component has been added to `app.component.ts` and will appear on all pages.

## Configuration

### Change WhatsApp Number
Edit `whatsapp-button.component.ts`:
```typescript
readonly whatsappNumber = '201556727127'; // Change this number
```

### Change Default Message
Edit `whatsapp-button.component.ts`:
```typescript
readonly defaultMessage = 'اريد مساعدة'; // Change this message
```

### Enable Pulse Animation
Add the `pulse` class to the button in `whatsapp-button.component.html`:
```html
<button class="whatsapp-float-button pulse" ...>
```

## Customization

### Position
Edit `whatsapp-button.component.scss`:
```scss
.whatsapp-float-button {
    bottom: 30px;  // Adjust vertical position
    right: 30px;   // Adjust horizontal position
}
```

### Size
```scss
.whatsapp-float-button {
    width: 60px;   // Adjust width
    height: 60px;  // Adjust height
    font-size: 32px; // Adjust icon size
}
```

### Color
```scss
.whatsapp-float-button {
    background-color: #25D366; // Change background color
    
    &:hover {
        background-color: #20ba5a; // Change hover color
    }
}
```

## Responsive Breakpoints

- **Desktop**: 60px × 60px
- **Tablet** (≤768px): 56px × 56px
- **Mobile** (≤480px): 52px × 52px

## RTL Support

The button automatically switches to the bottom-left corner when the page direction is RTL (Arabic).

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Usage in Other Components

If you want to use the button in specific pages instead of globally:

1. Remove it from `app.component.ts`
2. Import it in your desired component:
```typescript
import { WhatsappButtonComponent } from './shared/components/whatsapp-button/whatsapp-button.component';

@Component({
    imports: [WhatsappButtonComponent],
    // ...
})
```
3. Add to template:
```html
<app-whatsapp-button></app-whatsapp-button>
```

## Dependencies

- Font Awesome 6.5.1 (loaded via CDN in index.html)
- No additional npm packages required

## Accessibility

- Proper `aria-label` for screen readers
- Keyboard focusable with visible focus indicator
- Clear title attribute for tooltips

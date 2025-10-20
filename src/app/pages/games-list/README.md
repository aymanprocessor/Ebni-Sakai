# Games List Page

## Overview
This component displays a grid of all available educational games (1-50) with search functionality.

## Features
- Grid layout displaying 50 games
- Search functionality to filter games by title or number
- Responsive design (1-4 columns based on screen size)
- Card-based UI with hover effects
- RTL (Right-to-Left) support for Arabic
- Bilingual support (Arabic & English)

## Routes
- Access at: `/app/game`
- Requires authentication (protected by `authGuard`)

## Game Navigation
Each game card navigates to: `/app/game/{number}` (where number is 1-50)

## Search
Users can search for games by:
- Game number (e.g., "5")
- Game title (e.g., "لعبة")

## Translation Keys
### Arabic (ar-EG.json)
```json
"pages.gamesList.title": "الألعاب التعليمية"
"pages.gamesList.subtitle": "اختر لعبة لتبدأ المتعة والتعلم"
"pages.gamesList.back": "رجوع"
"pages.gamesList.searchPlaceholder": "ابحث عن لعبة..."
"pages.gamesList.play": "العب الآن"
"pages.gamesList.noResults": "لا توجد نتائج للبحث"
```

## Dependencies
- PrimeNG CardModule
- PrimeNG ButtonModule
- PrimeNG InputTextModule
- Angular Router
- Angular FormsModule
- ngx-translate

## Customization
To modify the number of games displayed, update the `initializeGames()` method in the component.

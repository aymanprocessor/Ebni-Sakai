# Selection Page

## Overview
This component provides a landing page where users can choose between two main sections:
- **المقاييس (Assessments/Surveys)**: For taking assessments and surveys to evaluate child development
- **الألعاب (Games)**: For exploring educational games

## Features
- Clean, card-based UI with hover effects
- Fully responsive design
- RTL (Right-to-Left) support for Arabic
- Bilingual support (Arabic & English)
- Smooth navigation animations

## Routes
- Access at: `/app/selection`
- Requires authentication (protected by `authGuard`)

## Navigation
- Click on "المقاييس" card → Navigate to `/app/survey/list`
- Click on "الألعاب" card → Navigate to `/app/game`

## Translation Keys
### Arabic (ar-EG.json)
```json
"pages.selection.title": "اختر ما تريد"
"pages.selection.subtitle": "اختر بين المقاييس أو الألعاب للمتابعة"
"pages.selection.assessmentsDesc": "قم بإجراء المقاييس والاستبيانات لتقييم نمو الطفل"
"pages.selection.gamesDesc": "استكشف الألعاب التعليمية الممتعة"
"pages.selection.startAssessments": "ابدأ المقاييس"
"pages.selection.startGames": "ابدأ الألعاب"
```

## Dependencies
- PrimeNG CardModule
- PrimeNG ButtonModule
- Angular Router
- ngx-translate

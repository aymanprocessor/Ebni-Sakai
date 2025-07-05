# Kid Skills - Child Development Assessment Platform

<div align="center">

![Kid Skills Logo](public/assets/images/Logo.png)

**A comprehensive platform for child development assessment, therapy booking, and progress tracking**

[![Angular](https://img.shields.io/badge/Angular-19.0-red.svg)](https://angular.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-19.0-blue.svg)](https://primeng.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

[Live Demo](https://ebni-sakai.vercel.app) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

## 🌟 Overview

Kid Skills (Ebni-Sakai) is a modern, bilingual platform designed to support child development through comprehensive assessments, therapy session booking, and progress tracking. Built with Angular 19 and Firebase, it serves parents, child development specialists, and administrators with role-based access and real-time collaboration features.

### 🎯 Key Features

- **🧠 Developmental Assessments** - Age-appropriate questionnaires and evaluations
- **📅 Smart Booking System** - Schedule therapy sessions with integrated Zoom meetings
- **👥 Multi-Role Support** - Parents, specialists, and administrators with tailored experiences
- **🌍 Bilingual Interface** - Full Arabic and English support with RTL layout
- **📊 Progress Tracking** - Comprehensive surveys and assessment results
- **🎥 Video Integration** - Seamless Zoom SDK integration for virtual sessions
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **🔐 Secure Authentication** - Firebase Auth with Google OAuth integration

## 🏗️ Architecture

### Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Angular 19, TypeScript 5.6 |
| **UI Framework** | PrimeNG 19, Tailwind CSS 3.4 |
| **Backend** | Firebase (Firestore, Auth, Functions) |
| **Video Conferencing** | Zoom SDK 3.13 |
| **Internationalization** | ngx-translate 16 |
| **Deployment** | Vercel, Firebase Hosting |
| **Development** | Angular CLI, ESLint, Prettier |

### Project Structure

```
src/
├── app/
│   ├── guards/           # Route guards (auth, admin, specialist)
│   ├── layout/           # Application layout components
│   ├── models/           # TypeScript interfaces and models
│   ├── pages/            # Feature pages and components
│   │   ├── auth/         # Authentication pages
│   │   ├── booking/      # Appointment booking system
│   │   ├── children/     # Child management
│   │   ├── dashboard/    # Role-based dashboards
│   │   ├── survey/       # Assessment and survey system
│   │   └── ...
│   ├── services/         # Business logic and API services
│   └── shared/           # Shared components and utilities
├── assets/               # Static assets and styles
├── environments/         # Environment configurations
└── public/
    ├── assets/images/    # Application images and logos
    └── i18n/             # Translation files (ar-EG, en-US)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Angular CLI** 19+
- **Firebase Account** with project setup
- **Zoom Developer Account** (for video integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aymanprocessor/Ebni-Sakai.git
   cd Ebni-Sakai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create environment files:
   ```bash
   # Development
   cp src/environments/env.dev.ts.example src/environments/env.dev.ts
   
   # Production
   cp src/environments/env.prod.ts.example src/environments/env.prod.ts
   ```

4. **Firebase Configuration**
   
   Update your environment files with Firebase config:
   ```typescript
   export const environment = {
     production: false,
     firebase: {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "your-app-id"
     },
     zoom: {
       apiKey: "your-zoom-api-key",
       apiSecret: "your-zoom-api-secret"
     }
   };
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```
   
   Navigate to `http://localhost:4200/`

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Run ESLint |

### Code Standards

- **TypeScript** strict mode enabled
- **ESLint** with Angular recommended rules
- **Prettier** for consistent formatting
- **Conventional Commits** for commit messages

### Development Workflow

1. Create feature branch from `main`
2. Implement changes following Angular style guide
3. Add/update tests as needed
4. Run linting and formatting
5. Submit pull request with clear description

## 📋 Features Documentation

### User Roles & Permissions

#### 👨‍👩‍👧‍👦 Parents/Users
- Register and manage children profiles
- Book therapy sessions
- Complete developmental assessments
- View progress reports
- Access educational resources

#### 👩‍⚕️ Specialists
- Manage appointment schedules
- Conduct virtual therapy sessions
- Review assessment results
- Update session notes
- Track client progress

#### 👨‍💼 Administrators
- User and specialist management
- Platform analytics and reporting
- Content management
- System configuration

### Core Modules

#### 🧠 Assessment Engine
- **Age-based Questionnaires** - Tailored to child's developmental stage
- **Multi-domain Evaluation** - Cognitive, motor, social, and language skills
- **Progress Tracking** - Historical data and trend analysis
- **Automated Scoring** - Intelligent assessment interpretation

#### 📅 Booking System
- **Smart Scheduling** - Conflict detection and availability management
- **Zoom Integration** - Automatic meeting creation and joining
- **Notification System** - Email and in-app reminders
- **Cancellation Management** - Flexible rescheduling options

#### 🌍 Internationalization
- **Arabic/English Support** - Complete UI translation
- **RTL Layout** - Proper right-to-left text direction
- **Cultural Adaptation** - Localized date/time formats
- **Dynamic Language Switching** - Real-time language changes

## 🚀 Deployment

### Firebase Deployment

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and Initialize**
   ```bash
   firebase login
   firebase init
   ```

3. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

4. **Deploy Hosting**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables

Set the following environment variables in your deployment platform:

```bash
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
ZOOM_API_KEY=your_zoom_api_key
ZOOM_API_SECRET=your_zoom_api_secret
```

## 🔌 API & Services

### Core Services

#### AuthService
- User authentication and authorization
- Role-based access control
- Google OAuth integration
- Session management

#### BookingService
- Appointment scheduling and management
- Zoom meeting integration
- Conflict detection
- Notification handling

#### AssessmentService
- Developmental questionnaire management
- Progress tracking
- Age-appropriate content delivery
- Results analysis

#### ChildrenService
- Child profile management
- Age calculation utilities
- Developmental milestone tracking

### Firebase Integration

- **Firestore** - Real-time database for all application data
- **Authentication** - User management and security
- **Functions** - Server-side logic and API endpoints
- **Hosting** - Static file serving and routing

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Follow Angular style guide
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👥 Team

**Kid Skills Development Team**
- Made with ❤️ in Egypt

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/aymanprocessor/Ebni-Sakai/wiki)
- **Issues**: [GitHub Issues](https://github.com/aymanprocessor/Ebni-Sakai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aymanprocessor/Ebni-Sakai/discussions)

## 🙏 Acknowledgments

- [Angular Team](https://angular.io/) for the amazing framework
- [PrimeNG](https://primeng.org/) for the comprehensive UI components
- [Firebase](https://firebase.google.com/) for the backend infrastructure
- [Zoom](https://zoom.us/) for video conferencing capabilities

---

<div align="center">

**[⬆ Back to Top](#kid-skills---child-development-assessment-platform)**

Made with ❤️ by the Kid Skills Team

</div>

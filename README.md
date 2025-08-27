# CycleWise - Privacy-First Period Tracker

A comprehensive, privacy-focused period and reproductive health tracking Progressive Web App (PWA) built with Next.js, TypeScript, and modern web technologies.

## 🌟 Features

### Core Tracking
- **Period Logging**: Track period start/end dates, flow intensity, and notes
- **Symptom Tracking**: Log 50+ symptoms across physical, emotional, digestive, and sleep categories
- **Smart Predictions**: AI-powered cycle predictions with confidence scores and explanations
- **Multiple Modes**: Regular tracking, TTC (trying to conceive), pregnancy, postpartum, and perimenopause

### Wellness & Self-Care
- **Breathing Exercises**: Guided breathing sessions with Box, 4-7-8, and Coherent breathing protocols
- **Mood Tracking**: Daily mood logging with trend analysis
- **Cycle-Aware Tips**: Personalized recommendations based on your current cycle phase
- **Pain Management**: Track pain levels and effectiveness of relief methods

### Privacy & Security
- **Local-First**: All data stored locally using IndexedDB with Dexie.js
- **End-to-End Encryption**: AES-GCM encryption using WebCrypto API
- **Anonymous by Default**: No account required, no tracking, no data collection
- **Discreet Mode**: Neutral app appearance and optional passcode protection

### Progressive Web App
- **Offline Capable**: Full functionality without internet connection
- **Installable**: Install as native app on mobile and desktop
- **Push Notifications**: Customizable reminders for periods, pills, and wellness
- **Background Sync**: Seamless data synchronization when back online

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cyclewise.git
   cd cyclewise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Optional: VAPID keys for push notifications
   NEXT_PUBLIC_VAPID_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   
   # Optional: Analytics (Plausible)
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or serve static files
npm run export
```

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Click the install icon in the address bar
2. Follow the installation prompts
3. App will be available in your applications menu

### Mobile (Android/iOS)
1. Open in Chrome/Safari
2. Tap "Add to Home Screen" from the browser menu
3. App will appear on your home screen

### Android App Store (TWA)
See [Android Packaging Guide](./docs/android-packaging.md) for publishing to Google Play Store.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with persistence
- **Database**: Dexie.js (IndexedDB wrapper)
- **Encryption**: Web Crypto API (AES-GCM)
- **PWA**: Custom service worker with Workbox
- **Testing**: Vitest + React Testing Library + Playwright
- **Build**: Turbopack for development, Webpack for production

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Main dashboard
│   ├── onboarding/        # First-time user flow
│   ├── tracking/          # Period/symptom logging
│   ├── wellness/          # Breathing exercises
│   ├── pwa/               # PWA-specific components
│   └── ui/                # shadcn/ui base components
├── lib/                   # Core utilities
│   ├── crypto.ts          # Encryption utilities
│   ├── database.ts        # Dexie database layer
│   ├── predictions.ts     # Cycle prediction algorithms
│   ├── store.ts           # Zustand state management
│   ├── types.ts           # TypeScript definitions
│   └── pwa.ts             # PWA utilities
└── public/                # Static assets
    ├── manifest.json      # PWA manifest
    ├── sw.js              # Service worker
    └── icons/             # App icons
```

## 🔒 Security & Privacy

### Data Protection
- **Local Storage**: All personal data stored in browser's IndexedDB
- **Encryption**: AES-GCM with PBKDF2 key derivation (100,000 iterations)
- **No Servers**: No backend servers, no data transmission
- **Secure Context**: HTTPS required for all cryptographic operations

### Privacy Features
- **Anonymous Usage**: No accounts, no tracking pixels, no analytics by default
- **Data Portability**: Full data export/import in JSON format
- **Right to Deletion**: Complete local data wipe functionality
- **Discreet Mode**: Neutral app appearance and content

### Security Best Practices
- Content Security Policy (CSP) headers
- Subresource Integrity (SRI) for external resources
- Secure headers (X-Frame-Options, X-Content-Type-Options)
- Input validation and sanitization
- Regular dependency updates

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Component Tests
```bash
# Test React components
npm run test:components
```

### End-to-End Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui
```

### Test Coverage
- Unit tests for prediction algorithms
- Component tests for critical user flows
- E2E tests for complete user journeys
- Accessibility testing with axe-core

## 📊 Performance

### Lighthouse Scores (Target)
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 95+
- PWA: 100

### Optimization Features
- Code splitting and lazy loading
- Image optimization with WebP/AVIF
- Service worker caching strategies
- Bundle size monitoring
- Performance budgets

## 🌐 Internationalization

### Supported Languages
- English (en) - Primary
- Spanish (es) - Planned
- Hindi (hi) - Planned

### Adding New Languages
1. Add locale files in `src/locales/`
2. Update `next.config.js` with new locale
3. Test RTL support if applicable

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
npm run deploy:vercel
```

### Netlify
```bash
# Build for Netlify
npm run build
npm run export

# Deploy dist/ folder
```

### Docker
```bash
# Build Docker image
docker build -t cyclewise .

# Run container
docker run -p 3000:3000 cyclewise
```

## 📱 Android App (TWA)

### Prerequisites
- Android Studio
- Java Development Kit (JDK) 11+
- Android SDK

### Build Android App
```bash
# Generate Android project
npm run android:init

# Build APK
npm run android:build

# Build AAB for Play Store
npm run android:bundle
```

### Play Store Deployment
See detailed guide in [docs/android-deployment.md](./docs/android-deployment.md)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configuration
- Conventional commit messages
- Test coverage requirements
- Accessibility guidelines (WCAG 2.2 AA)

### Bug Reports
Please use the issue template and include:
- Device/browser information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Lucide](https://lucide.dev/) for consistent icons
- [Dexie.js](https://dexie.org/) for IndexedDB abstraction
- [Recharts](https://recharts.org/) for data visualization
- [date-fns](https://date-fns.org/) for date manipulation

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Security Issues**: security@cyclewise.app
- **General Support**: support@cyclewise.app
- **Community**: [GitHub Discussions](https://github.com/yourusername/cyclewise/discussions)

## 🗺️ Roadmap

### v1.1 (Planned)
- [ ] Advanced cycle analytics
- [ ] Backup to cloud storage (optional)
- [ ] Partner sharing features
- [ ] Medication tracking
- [ ] Fertility signs tracking (BBT, LH tests)

### v1.2 (Future)
- [ ] AI-powered insights
- [ ] Integration with wearables
- [ ] Telehealth consultations
- [ ] Community features
- [ ] Advanced export formats

---

**Disclaimer**: CycleWise is for informational purposes only and is not intended to provide medical advice, diagnosis, or treatment. Always consult with healthcare professionals for medical concerns.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Pace Pilot ⚡

> Energy-driven productivity app with Pomodoro timer, task management, and AI-powered insights.

## Features

- 🎯 **Task Management** - Organize tasks by energy level and project
- ⏱️ **Pomodoro Timer** - Focus sessions with built-in timer
- 📊 **Analytics & Reports** - Track productivity with AI insights
- 📅 **Weekly Planner** - Plan your week with energy-based scheduling
- 🔄 **Recurring Tasks** - Automate repetitive workflows
- 🤖 **AI-Powered** - Gemini AI provides personalized productivity insights
- 📱 **PWA Support** - Install as a standalone app on any device

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Gemini API key ([Get one here](https://ai.google.dev/))

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and add your Gemini API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder with:

- ✅ Code splitting and tree shaking
- ✅ Minified and optimized assets
- ✅ PWA support with service worker
- ✅ Source maps disabled for security

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variable: `VITE_GEMINI_API_KEY`
4. Deploy!

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Push your code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_GEMINI_API_KEY`
6. Deploy!

### Deploy to GitHub Pages

1. Update `vite.config.ts` with your repo name:
   ```ts
   base: '/your-repo-name/'
   ```
2. Run:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder to GitHub Pages

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

## Project Structure

```
pacepilot/
├── components/          # React components
│   ├── ErrorBoundary.tsx
│   └── PomodoroTimer.tsx
├── services/           # API services
│   └── geminiService.ts
├── public/             # Static assets
├── App.tsx             # Main app component
├── index.tsx           # App entry point
├── types.ts            # TypeScript types
├── constants.ts        # App constants
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Features in Detail

### Energy-Based Task Management

Tasks are organized by energy levels (Low, Medium, High) to help you work with your natural energy rhythms:

- **High Energy**: Complex problem-solving, creative work
- **Medium Energy**: Meetings, collaborative tasks
- **Low Energy**: Administrative tasks, email

### AI Insights

Powered by Google Gemini:

- Daily productivity reports
- Weekly trend analysis
- Energy level recommendations
- Task prioritization suggestions

### PWA Support

Install Pace Pilot as a standalone app:

- Works offline
- Fast loading with service worker caching
- Native app-like experience
- Push notifications (coming soon)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:

- Create an issue on GitHub
- View app in AI Studio: https://ai.studio/apps/drive/1n0vTmKjZVYpOEkSKoRbYYPw1HlHOP_Li

---

Made with ⚡ by the Pace Pilot team

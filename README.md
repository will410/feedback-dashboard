# Feedback Intelligence Dashboard

A beautiful, interactive dashboard for analyzing customer feedback trends and revenue impact.

![Dashboard Preview](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## Features

- 📊 **Interactive Data Visualization** - Drill-down bar charts and timeline analysis
- 🔍 **Multi-level Filtering** - Filter by supplier, theme, and category
- 📈 **Real-time Analytics** - KPI cards showing feedback count, revenue risk, and supplier metrics
- 📁 **CSV Upload** - Load your own data with flexible column mapping
- 🎨 **Modern UI** - Clean, professional design with smooth interactions
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Deploy to Vercel (Recommended)

### Option 1: Deploy from GitHub

1. Push this project to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Vite settings
6. Click "Deploy"

Your dashboard will be live at `https://your-project.vercel.app` in ~1 minute!

### Option 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Alternative Hosting Options

### Netlify
```bash
# Build the project
npm run build

# Drag and drop the 'dist' folder to netlify.com/drop
```

### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

### Cloudflare Pages
1. Build: `npm run build`
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Upload the `dist` folder

## Using Your Own Data

The dashboard comes with sample data. To use your own CSV file:

1. Click "Load Full CSV" in the dashboard
2. Select your CSV file

### CSV Format

Your CSV should include these columns (flexible naming):
- `Date` or `Date (UTC)`
- `Supplier Name` or `Report Company (matched)`
- `Label` (feedback category)
- `Sub Label` (subcategory)
- `Micro Label` (detailed category)
- `Price` or `Subscription Amount (converted) AUD sum (matched)`
- `Message` (feedback text)

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Tailwind CSS** (via utility classes) - Styling

## Project Structure

```
feedback-dashboard/
├── src/
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── App.tsx          # App entry point
│   ├── main.tsx         # React DOM entry
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
└── package.json         # Dependencies
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React + Vite + TypeScript**

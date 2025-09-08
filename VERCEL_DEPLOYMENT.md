# Azure OpenAI PTU Estimator - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/azure-openai-ptu-estimator)

### Option 2: Manual Deployment

#### Prerequisites
- Node.js 18+ installed
- Vercel CLI installed: `npm i -g vercel`
- Git repository (GitHub, GitLab, or Bitbucket)

#### Step 1: Prepare Your Repository
```bash
# Clone or download this repository
git clone https://github.com/YOUR_USERNAME/azure-openai-ptu-estimator.git
cd azure-openai-ptu-estimator

# Install dependencies
npm install
```

#### Step 2: Build and Test Locally
```bash
# Build the application
npm run build

# Test locally (optional)
npm run preview
```

#### Step 3: Deploy to Vercel

**Method A: Using Vercel CLI**
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: azure-openai-ptu-estimator
# - Directory: ./
# - Override settings? N
```

**Method B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect it's a Vite project
5. Click "Deploy"

#### Step 4: Configure (if needed)
The project includes a `vercel.json` configuration file that handles:
- Static file serving
- SPA routing
- Build settings

## 📁 Project Structure
```
azure-openai-ptu-estimator/
├── src/
│   ├── components/          # React components
│   ├── App.jsx             # Main application
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── package.json           # Dependencies
├── vercel.json           # Vercel configuration
└── vite.config.js        # Vite configuration
```

## 🔧 Environment Variables (Optional)
No environment variables are required for basic functionality.

## 🌐 Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 📊 Features Included
- ✅ Complete PTU vs PAYGO cost analysis
- ✅ Interactive charts and visualizations
- ✅ Alternative guidance for users without Log Analytics
- ✅ Mobile-responsive design
- ✅ Official Azure OpenAI pricing integration
- ✅ Burst pattern analysis
- ✅ Hybrid model calculations

## 🛠 Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Issues
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod
```

## 📝 License
MIT License - see LICENSE file for details.


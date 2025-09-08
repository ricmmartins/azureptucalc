# 🚀 Vercel Deployment Guide

Complete guide for deploying the Azure OpenAI PTU Estimator to Vercel.

## 📋 Prerequisites

- Node.js 18+ installed locally
- Git installed
- GitHub account
- Vercel account (free tier available)

## 🎯 Quick Deploy (Recommended)

### Method 1: GitHub Integration

1. **Fork or Clone Repository**
   ```bash
   git clone https://github.com/yourusername/azure-openai-ptu-estimator.git
   cd azure-openai-ptu-estimator
   ```

2. **Push to Your GitHub**
   ```bash
   # If you cloned, create your own repository
   git remote set-url origin https://github.com/YOURUSERNAME/azure-openai-ptu-estimator.git
   git push -u origin main
   ```

3. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel automatically detects Vite configuration
   - Click "Deploy"
   - Your app will be live in ~2 minutes!

### Method 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy from project directory
cd azure-openai-ptu-estimator
vercel --prod

# Follow the prompts:
# - Link to existing project? No
# - Project name: azure-openai-ptu-estimator
# - Directory: ./
# - Override settings? No
```

### Method 3: Drag & Drop

```bash
# Build the project locally
npm install
npm run build

# Go to vercel.com
# Drag and drop the 'dist' folder
# Your app will be deployed instantly
```

## ⚙️ Configuration

### Vercel Settings

The included `vercel.json` configures:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables (Optional)

If you need custom configurations:

1. **In Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add variables:

```
VITE_AZURE_PRICING_API=https://prices.azure.com/api/retail/prices
VITE_APP_TITLE=Azure OpenAI PTU Estimator
VITE_CACHE_DURATION=10800000
```

2. **Redeploy** after adding environment variables

### Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## 🔧 Build Configuration

### Vite Configuration

The `vite.config.js` is optimized for Vercel:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-select', '@radix-ui/react-tabs']
        }
      }
    }
  }
})
```

### Package.json Scripts

Ensure these scripts are in your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **404 on Refresh**
   - Ensure `vercel.json` has the rewrite rule
   - Check that `outputDirectory` is set to `dist`

3. **Large Bundle Size Warning**
   ```bash
   # This is normal for the rich UI components
   # The app still loads fast due to code splitting
   ```

4. **Environment Variables Not Working**
   - Ensure variables start with `VITE_`
   - Redeploy after adding variables
   - Check Vercel dashboard for correct values

### Performance Optimization

1. **Enable Compression**
   - Vercel automatically enables gzip/brotli
   - No additional configuration needed

2. **CDN and Caching**
   - Static assets cached automatically
   - API responses cached for 3 hours

3. **Bundle Analysis**
   ```bash
   # Analyze bundle size
   npm run build
   npx vite-bundle-analyzer dist
   ```

## 📊 Monitoring

### Vercel Analytics

1. **Enable Analytics:**
   - Go to Project Settings → Analytics
   - Enable Web Analytics (free tier available)

2. **Performance Monitoring:**
   - View Core Web Vitals
   - Monitor page load times
   - Track user interactions

### Custom Monitoring

Add to your `index.html` for additional tracking:

```html
<!-- Google Analytics (optional) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔄 Continuous Deployment

### Automatic Deployments

With GitHub integration:
- ✅ **Main branch** → Production deployment
- ✅ **Pull requests** → Preview deployments
- ✅ **Commits** → Automatic rebuilds

### Manual Deployments

```bash
# Deploy specific branch
vercel --prod --branch feature-branch

# Deploy with custom alias
vercel --prod --alias my-custom-domain.vercel.app
```

## 🌍 Global Distribution

Vercel automatically:
- ✅ **Edge Network** - 100+ global locations
- ✅ **Smart CDN** - Automatic asset optimization
- ✅ **Edge Functions** - Run code close to users
- ✅ **DDoS Protection** - Built-in security

## 💰 Cost Considerations

### Free Tier Limits
- ✅ **100GB bandwidth** per month
- ✅ **100 deployments** per day
- ✅ **Unlimited** static sites
- ✅ **Custom domains** included

### Pro Tier Benefits ($20/month)
- ✅ **1TB bandwidth** per month
- ✅ **Advanced analytics**
- ✅ **Password protection**
- ✅ **Team collaboration**

## 🔐 Security

### HTTPS
- ✅ **Automatic SSL** certificates
- ✅ **HTTP/2** support
- ✅ **Security headers** included

### Content Security Policy

Add to `index.html` for enhanced security:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://prices.azure.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://prices.azure.com;
">
```

## 📱 Mobile Optimization

The app is already optimized for mobile:
- ✅ **Responsive design** with Tailwind CSS
- ✅ **Touch-friendly** UI components
- ✅ **Fast loading** on mobile networks
- ✅ **PWA-ready** (can be added to home screen)

## 🎉 Success!

Your Azure OpenAI PTU Estimator is now live on Vercel!

### Next Steps

1. **Share your deployment** with your team
2. **Set up custom domain** if needed
3. **Enable analytics** to track usage
4. **Monitor performance** and optimize as needed

### Example URLs

- **Production**: `https://azure-openai-ptu-estimator.vercel.app`
- **Custom domain**: `https://ptu-calculator.yourcompany.com`
- **Preview**: `https://azure-openai-ptu-estimator-git-feature-yourusername.vercel.app`

---

**Need help?** Check the [Vercel Documentation](https://vercel.com/docs) or [open an issue](https://github.com/yourusername/azure-openai-ptu-estimator/issues).


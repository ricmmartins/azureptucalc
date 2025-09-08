# Azure Deployment Guide

This guide provides step-by-step instructions for deploying the Azure OpenAI PTU Estimator to various Azure services.

## 🚀 Deployment Options

### Option 1: Azure Static Web Apps (Recommended)

Azure Static Web Apps is perfect for React applications with automatic CI/CD from GitHub.

#### Prerequisites
- Azure subscription
- GitHub account
- Azure CLI installed

#### Step 1: Prepare Your Repository
```bash
# Fork or clone the repository
git clone https://github.com/your-username/azure-openai-ptu-estimator.git
cd azure-openai-ptu-estimator

# Push to your GitHub repository
git remote add origin https://github.com/your-username/azure-openai-ptu-estimator.git
git push -u origin main
```

#### Step 2: Create Static Web App via Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web Apps"
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `azure-openai-ptu-estimator`
   - **Plan Type**: Free (for development) or Standard (for production)
   - **Region**: Choose closest to your users
   - **Source**: GitHub
   - **Organization**: Your GitHub username
   - **Repository**: `azure-openai-ptu-estimator`
   - **Branch**: `main`
   - **Build Presets**: React
   - **App location**: `/`
   - **Output location**: `dist`

#### Step 3: Create via Azure CLI (Alternative)
```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-ptu-estimator --location "East US 2"

# Create Static Web App
az staticwebapp create \
  --name azure-openai-ptu-estimator \
  --resource-group rg-ptu-estimator \
  --source https://github.com/your-username/azure-openai-ptu-estimator \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

#### Step 4: Configure Build Settings
The deployment will automatically create `.github/workflows/azure-static-web-apps-*.yml`. Verify it contains:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "dist"
```

### Option 2: Azure Container Apps

For containerized deployment with more control over the runtime environment.

#### Step 1: Create Dockerfile
```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 2: Create Nginx Configuration
```nginx
# deployment/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    
    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

#### Step 3: Deploy to Container Apps
```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-ptu-estimator --location "East US 2"

# Create Container Apps environment
az containerapp env create \
  --name ptu-estimator-env \
  --resource-group rg-ptu-estimator \
  --location "East US 2"

# Build and push container image
az acr create --resource-group rg-ptu-estimator --name ptuEstimatorRegistry --sku Basic
az acr login --name ptuEstimatorRegistry

# Build and push image
docker build -t ptuEstimatorRegistry.azurecr.io/azure-openai-ptu-estimator:latest .
docker push ptuEstimatorRegistry.azurecr.io/azure-openai-ptu-estimator:latest

# Create container app
az containerapp create \
  --name azure-openai-ptu-estimator \
  --resource-group rg-ptu-estimator \
  --environment ptu-estimator-env \
  --image ptuEstimatorRegistry.azurecr.io/azure-openai-ptu-estimator:latest \
  --target-port 80 \
  --ingress 'external' \
  --registry-server ptuEstimatorRegistry.azurecr.io \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 3
```

### Option 3: Azure App Service

Traditional web app hosting with easy scaling and management.

#### Step 1: Create App Service Plan
```bash
# Create resource group
az group create --name rg-ptu-estimator --location "East US 2"

# Create App Service Plan
az appservice plan create \
  --name ptu-estimator-plan \
  --resource-group rg-ptu-estimator \
  --sku B1 \
  --is-linux
```

#### Step 2: Create Web App
```bash
# Create web app with Node.js runtime
az webapp create \
  --resource-group rg-ptu-estimator \
  --plan ptu-estimator-plan \
  --name azure-openai-ptu-estimator \
  --runtime "NODE|18-lts" \
  --deployment-source-url https://github.com/your-username/azure-openai-ptu-estimator \
  --deployment-source-branch main
```

#### Step 3: Configure Deployment
```bash
# Configure continuous deployment
az webapp deployment source config \
  --name azure-openai-ptu-estimator \
  --resource-group rg-ptu-estimator \
  --repo-url https://github.com/your-username/azure-openai-ptu-estimator \
  --branch main \
  --manual-integration
```

## 🔧 Infrastructure as Code

### Bicep Template
```bicep
// deployment/main.bicep
@description('Name of the Static Web App')
param staticWebAppName string = 'azure-openai-ptu-estimator'

@description('Location for all resources')
param location string = resourceGroup().location

@description('GitHub repository URL')
param repositoryUrl string

@description('GitHub branch')
param branch string = 'main'

resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: '/'
      outputLocation: 'dist'
    }
  }
}

output staticWebAppUrl string = staticWebApp.properties.defaultHostname
```

Deploy with:
```bash
az deployment group create \
  --resource-group rg-ptu-estimator \
  --template-file deployment/main.bicep \
  --parameters repositoryUrl=https://github.com/your-username/azure-openai-ptu-estimator
```

## 🔒 Security Configuration

### Environment Variables
```bash
# Set environment variables for production
az staticwebapp appsettings set \
  --name azure-openai-ptu-estimator \
  --setting-names VITE_ENVIRONMENT=production
```

### Custom Domain (Optional)
```bash
# Add custom domain
az staticwebapp hostname set \
  --name azure-openai-ptu-estimator \
  --hostname your-domain.com
```

## 📊 Monitoring and Logging

### Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app ptu-estimator-insights \
  --location "East US 2" \
  --resource-group rg-ptu-estimator \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app ptu-estimator-insights \
  --resource-group rg-ptu-estimator \
  --query instrumentationKey
```

### Log Analytics
```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group rg-ptu-estimator \
  --workspace-name ptu-estimator-logs \
  --location "East US 2"
```

## 🚀 Performance Optimization

### CDN Configuration
```bash
# Create CDN profile
az cdn profile create \
  --name ptu-estimator-cdn \
  --resource-group rg-ptu-estimator \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name ptu-estimator-endpoint \
  --profile-name ptu-estimator-cdn \
  --resource-group rg-ptu-estimator \
  --origin your-static-web-app.azurestaticapps.net
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Azure Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: 'upload'
        app_location: '/'
        output_location: 'dist'
```

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
az staticwebapp show --name azure-openai-ptu-estimator --query "buildProperties"

# View deployment logs in GitHub Actions
```

#### Performance Issues
```bash
# Enable Application Insights
# Monitor performance metrics
# Check CDN cache hit rates
```

#### SSL Certificate Issues
```bash
# Verify custom domain configuration
az staticwebapp hostname show --name azure-openai-ptu-estimator
```

### Support Resources
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Container Apps Documentation](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)

---

**Need help?** Open an issue in the [GitHub repository](https://github.com/your-username/azure-openai-ptu-estimator/issues).


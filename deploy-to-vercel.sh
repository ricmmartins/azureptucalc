#!/bin/bash

# Azure OpenAI PTU Estimator - Vercel Deployment Script
# This script automates the deployment process to Vercel

echo "🚀 Azure OpenAI PTU Estimator - Vercel Deployment"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build successful!"

echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "Your Azure OpenAI PTU Estimator is now live on Vercel!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi


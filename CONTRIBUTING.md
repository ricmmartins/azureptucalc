# Contributing to Azure OpenAI PTU Calculator

Thank you for your interest in contributing to the Azure OpenAI PTU Calculator! This document provides guidelines and information for contributors.

## First-Time Contributors

- Look for issues labeled "good first issue" - these are great starting points!
- Don't hesitate to ask questions in your PR or issue
- See the [MIT License](LICENSE) for terms of use and contribution

By contributing, you agree to the terms of the MIT license. See [LICENSE](LICENSE) for details.

## How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/ricmmartins/azureptucalc/issues) page
- Search existing issues before creating a new one
- Provide detailed information including:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser and version
  - Screenshots if applicable

### Suggesting Features
- Open a [GitHub Discussion](https://github.com/ricmmartins/azureptucalc/discussions)
- Describe the feature and its use case
- Explain how it would benefit users

### Code Contributions

#### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/ricmmartins/azureptucalc.git
cd azureptucalc

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### Branch Strategy
- `main` - Production-ready code (deployed automatically via Vercel)
- `feature/feature-name` - Individual features
- `bugfix/issue-number` - Bug fixes

#### Pull Request Process
1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Update documentation** if needed
4. **Ensure the build succeeds** (`npm run build`)
5. **Create a pull request** with a clear description

## Development Guidelines

### Tech Stack
- **React 18** with plain JavaScript/JSX (no TypeScript)
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Recharts** for data visualization
- **Vercel** for deployment

### Code Style
- Use **JavaScript/JSX** (not TypeScript)
- Follow **React hooks patterns** - functional components only
- Use **Tailwind CSS** utility classes for styling
- Add **JSDoc comments** for complex functions
- Implement **proper error handling** with try/catch

### Component Structure
```jsx
import React, { useState, useEffect } from 'react';

/**
 * Component description
 * @param {Object} props - Component props
 */
export const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};
```

### File Organization
```
src/
+-- App.jsx                      # Main application
+-- components/
|   +-- ui/                      # shadcn/ui base components
|   +-- EnhancedResults.jsx      # Results display component
|   +-- GuidedTour.jsx           # 6-step interactive tour
|   +-- WelcomeModal.jsx         # Welcome dialog
+-- enhanced_model_config.json   # 17 PTU model configurations
+-- official_token_pricing.js    # PAYGO + Priority Processing rates
+-- officialPTUPricing.js        # PTU reservation pricing
+-- enhanced_pricing_service.js  # Azure API pricing service
+-- ExternalPricingService.js    # Fallback pricing config reader
+-- external_pricing_config.json # Static fallback pricing data
api/
+-- azure-pricing.js             # Vercel serverless proxy for Azure Retail Prices API
```

### Pricing Data
The calculator uses a 4-tier pricing priority:
1. **Custom Override** - user-provided rates
2. **Live Azure API** - real-time from Azure Retail Prices API (3-hour cache)
3. **Official Hardcoded** - curated from Microsoft documentation
4. **Fallback** - conservative defaults

When modifying pricing data:
- Cross-reference with [Azure OpenAI pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)
- Ensure consistency across all pricing files
- Azure PTU reservations: Monthly and 1-Year only (no 3-year)

## Getting Help

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas

### Development Resources
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to the Azure OpenAI PTU Calculator!**

Your contributions help make Azure OpenAI cost optimization accessible to everyone.

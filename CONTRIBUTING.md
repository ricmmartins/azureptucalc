# Contributing to Azure OpenAI PTU Estimator

Thank you for your interest in contributing to the Azure OpenAI PTU Estimator! This document provides guidelines and information for contributors.

## � First-Time Contributors

- Look for issues labeled "good first issue"—these are great starting points!
- Don’t hesitate to ask questions in your PR or issue
- See the [MIT License](LICENSE) for terms of use and contribution

By contributing, you agree to the terms of the MIT license. See [LICENSE](LICENSE) for details.

## �🤝 How to Contribute

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
- Consider implementation complexity

### Code Contributions

#### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/ricmmartins/azureptucalc.git
cd azure-openai-ptu-estimator

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

#### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Individual features
- `bugfix/issue-number` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes

#### Pull Request Process
1. **Fork the repository** and create your branch from `develop`
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all tests pass** and the build succeeds
6. **Create a pull request** with a clear description

## 📋 Development Guidelines

### Code Style
- Use **TypeScript** for new features when possible
- Follow **React best practices** and hooks patterns
- Use **functional components** over class components
- Implement **proper error handling**
- Add **JSDoc comments** for complex functions

### Component Structure
```jsx
// Good component structure
import React, { useState, useEffect } from 'react';
import { ComponentProps } from './types';

/**
 * Component description
 * @param {ComponentProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export const MyComponent: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2 
}) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  const handleEvent = useCallback(() => {
    // Event handler
  }, [dependencies]);

  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};
```

### Styling Guidelines
- Use **Tailwind CSS** utility classes
- Follow **mobile-first** responsive design
- Maintain **consistent spacing** using Tailwind scale
- Use **semantic color names** from the design system
- Implement **dark mode support** where applicable

### Testing Requirements
- **Unit tests** for utility functions
- **Component tests** for React components
- **Integration tests** for complex workflows
- **E2E tests** for critical user paths
- Maintain **80%+ code coverage**

```javascript
// Example test structure
describe('PricingCalculator', () => {
  it('should calculate PTU costs correctly', () => {
    const result = calculatePTUCost(params);
    expect(result).toEqual(expectedResult);
  });

  it('should handle edge cases', () => {
    const result = calculatePTUCost(edgeCaseParams);
    expect(result).toBeDefined();
  });
});
```

## 🏗️ Architecture Guidelines

### File Organization
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── __tests__/          # Test files
```

### State Management
- Use **React hooks** for local state
- Implement **custom hooks** for shared logic
- Consider **Context API** for global state
- Use **useReducer** for complex state logic

### API Integration
- Centralize API calls in **service modules**
- Implement **proper error handling**
- Use **TypeScript interfaces** for API responses
- Add **retry logic** for failed requests
- Implement **caching strategies**

### Performance Considerations
- Use **React.memo** for expensive components
- Implement **lazy loading** for large components
- Optimize **bundle size** with code splitting
- Use **useMemo** and **useCallback** appropriately
- Monitor **Core Web Vitals**

## 🔧 Specific Contribution Areas

### Pricing Service Enhancements
- Improve Azure API integration
- Add support for new Azure regions
- Implement better error handling
- Add pricing validation logic

### UI/UX Improvements
- Enhance mobile responsiveness
- Improve accessibility (WCAG compliance)
- Add loading states and animations
- Implement better error messages

### Documentation
- Update README files
- Add code comments
- Create user guides
- Write API documentation

### Testing
- Add unit tests for new features
- Implement integration tests
- Create E2E test scenarios
- Improve test coverage

## 📊 Quality Standards

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Accessibility standards met
- [ ] Performance impact considered
- [ ] Security implications reviewed

### Definition of Done
- [ ] Feature is fully implemented
- [ ] Tests are written and passing
- [ ] Code is reviewed and approved
- [ ] Documentation is updated
- [ ] No breaking changes (or properly communicated)
- [ ] Deployment is successful

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Checklist
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Deploy to production
5. Monitor for issues

## 🆘 Getting Help

### Communication Channels
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Email** - [ricardo.martins@microsoft.com](mailto:ricardo.martins@microsoft.com)

### Development Resources
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Vite Documentation](https://vitejs.dev/guide/)

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- GitHub contributors page
- Release notes for significant contributions
- Annual contributor appreciation

---

**Thank you for contributing to the Azure OpenAI PTU Estimator!** 🎉

Your contributions help make Azure OpenAI cost optimization accessible to everyone.


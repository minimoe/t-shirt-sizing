# T-Shirt Sizing App Development Guide

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **Imports**: Group by source with React/Next.js first, then third-party libraries, then local modules
- **Formatting**: Use 2-space indentation, single quotes, semicolons
- **Components**: Use functional components with hooks
- **State Management**: Prefer useState/useEffect over Redux for simpler state
- **Styling**: Use styled-jsx for component-scoped CSS
- **Error Handling**: Use try/catch blocks and show user-friendly error messages
- **Naming**: 
  - camelCase for variables/functions
  - PascalCase for components
  - ALL_CAPS for constants
- **Real-time Logic**: Handle WebSocket state with careful cleanup in useEffect
# SkillUp Frontend

This is the frontend application for SkillUp, built with Next.js, React, and TypeScript.

## Features

- **Modern Stack**: Next.js 15 with React 19 and TypeScript
- **Authentication**: Supabase Auth integration
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand for client state
- **Form Handling**: React Hook Form with Zod validation
- **Real-time**: Socket.io integration
- **Testing**: Jest with React Testing Library

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (copy `.env.example` to `.env.local`)

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Testing

This project uses Jest with React Testing Library for testing. The testing framework includes:

### Test Configuration

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **jsdom**: DOM implementation for Node.js
- **@testing-library/jest-dom**: Custom Jest matchers

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests should be placed in `__tests__` directories or use `.test.tsx` or `.spec.tsx` suffixes.

Example test structure:
```
src/
  components/
    ui/
      __tests__/
        button.test.tsx
      button.tsx
```

### CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/test.yml`) that:

- Runs on every push and pull request
- Tests against Node.js 18.x and 20.x
- Runs linting, tests, and builds
- Generates coverage reports
- Optimizes parallel test execution

### Coverage Thresholds

The project maintains minimum coverage requirements:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and services
└── __tests__/          # Global test utilities
```

## Development Guidelines

1. Write tests for new components and features
2. Maintain code coverage above the defined thresholds
3. Follow the established component patterns
4. Use TypeScript for type safety
5. Follow the linting rules

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Testing Setup for Kvitta UI

## 🎉 What's Been Set Up

Your testing infrastructure is now ready! Here's what has been created:

### Configuration Files
- ✅ `vitest.config.ts` - Unit/component test configuration
- ✅ `playwright.config.ts` - E2E test configuration  
- ✅ `tests/setup.ts` - Global test setup and mocks
- ✅ `package.json` - Added test scripts

### Mock Data & Utilities
- ✅ `tests/mocks/handlers.ts` - MSW API mocks
- ✅ `tests/mocks/server.ts` - MSW server setup
- ✅ `tests/fixtures/receipts.ts` - Mock receipt data
- ✅ `tests/fixtures/users.ts` - Mock user data
- ✅ `tests/fixtures/groups.ts` - Mock group data

### First Tests Created
- ✅ `lib/utils.test.ts` - Unit tests for utilities
- ✅ `lib/api.test.ts` - Unit tests for API client
- ✅ `components/ReceiptSplitter.test.tsx` - Component tests
- ✅ `e2e/auth.spec.ts` - E2E authentication tests

---

## 🚀 Next Steps

### 1. Install Dependencies

Run this command in your terminal:

\`\`\`bash
npm install -D vitest @vitest/ui @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw @playwright/test @vitest/coverage-v8
\`\`\`

### 2. Install Playwright Browsers

After the above completes, run:

\`\`\`bash
npx playwright install
\`\`\`

### 3. Run Your First Tests

\`\`\`bash
# Run all unit/component tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
\`\`\`

### 4. Run E2E Tests

\`\`\`bash
# Make sure your dev server is running first
npm run dev

# In another terminal, run E2E tests
npm run test:e2e

# Run E2E tests with UI (great for debugging)
npm run test:e2e:ui
\`\`\`

---

## 📝 Available Test Scripts

| Command | Description |
|---------|-------------|
| \`npm test\` | Run tests in watch mode |
| \`npm run test:ui\` | Run tests with visual UI |
| \`npm run test:run\` | Run tests once (CI mode) |
| \`npm run test:coverage\` | Generate coverage report |
| \`npm run test:e2e\` | Run E2E tests |
| \`npm run test:e2e:ui\` | Run E2E with UI |
| \`npm run test:e2e:debug\` | Debug E2E tests |

---

## 🧪 Test Examples

### Unit Test Example (lib/utils.test.ts)
Tests utility functions in isolation.

### API Test Example (lib/api.test.ts)
Tests API client with mocked network requests using MSW.

### Component Test Example (components/ReceiptSplitter.test.tsx)
Tests React component rendering and user interactions.

### E2E Test Example (e2e/auth.spec.ts)
Tests complete user flows in a real browser.

---

## 📚 Learning Resources

Check out these artifacts for detailed guides:
- **testing_guide.md** - Comprehensive testing explanation
- **testing_implementation_plan.md** - Step-by-step implementation
- **learning_roadmap.md** - 4-week learning plan

---

## 🐛 Troubleshooting

### Tests won't run?
Make sure you've installed all dependencies:
\`\`\`bash
npm install
\`\`\`

### MSW errors?
The mock server is set up in \`tests/mocks/\`. Check that handlers match your API endpoints.

### Type errors?
After installing dependencies, TypeScript should recognize the testing libraries.

### E2E tests failing?
Make sure your dev server is running on \`http://localhost:3000\`.

---

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] \`npm test\` runs without errors
- [ ] At least one test passes
- [ ] Coverage report generates
- [ ] Playwright browsers installed
- [ ] E2E test can connect to dev server

---

Happy Testing! 🎉

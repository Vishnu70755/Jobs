// src/test/accessibility/setup.ts
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);
// src/test/accessibility/input.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '@/components/ui/input';

expect.extend(toHaveNoViolations);

describe('Input Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Input placeholder="Enter text" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be accessible with label', async () => {
    const { container } = render(<label>
      Email:
      <Input type="email" aria-label="Email address" />
    </label>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle error states accessibly', async () => {
    const { container } = render(<div>
      <Input
        aria-invalid="true"
        aria-describedby="email-error"
        aria-label="Email"
        placeholder="Enter email"
      />
      <div id="email-error" role="alert">
        Please enter a valid email
      </div>
    </div>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

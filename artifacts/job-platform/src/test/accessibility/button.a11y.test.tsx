// src/test/accessibility/button.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click Me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be accessible with different variants', async () => {
    const variants = ['default', 'outline', 'secondary', 'destructive'];

    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>{variant} Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations(`${variant} button should be accessible`);
    }
  });

  it('should be accessible when disabled', async () => {
    const { container } = render(<Button disabled>Disabled Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper label when using aria-label', async () => {
    const { container } = render(<Button aria-label="Close">×</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
// src/test/accessibility/card.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';

expect.extend(toHaveNoViolations);

describe('Card Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Card>Card Content</Card>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be accessible with proper heading structure', async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle interactive elements correctly', async () => {
    const { container } = render(
      <Card>
        <button>Action Button</button>
        <input type="text" aria-label="Input in card" />
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

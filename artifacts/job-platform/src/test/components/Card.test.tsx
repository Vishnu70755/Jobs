import React from "react";
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';

describe('Card', () => {
  it('renders basic card', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    render(<Card className="custom-class">Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders correctly', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders correctly', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders correctly', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('CardDescription', () => {
  it('renders correctly', () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders correctly', () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

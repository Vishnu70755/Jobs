import React from "react";
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/input';
import { vi } from 'vitest';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('accepts value prop', () => {
    render(<Input aria-label="input" defaultValue="test value" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test value');
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input aria-label="input" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    input.value = 'new value';
    input.dispatchEvent(new Event('input'));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'new value' })
      })
    );
  });

  it('accepts type prop', () => {
    render(<Input aria-label="input" type="password" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'password');
  });
});

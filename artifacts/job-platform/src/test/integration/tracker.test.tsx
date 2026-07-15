import React from "react";
import { render, screen } from '@testing-library/react';
import { Tracker } from '@/pages/tracker';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock API handlers for tracker
const handlers = [
  rest.get('/api/applications/board', (req, res, ctx) => {
    return res(
      ctx.json({
        columns: [
          { id: 'applied', label: 'Applied', count: 5 },
          { id: 'interview', label: 'Interview', count: 2 },
          { id: 'offer', label: 'Offer', count: 1 },
        ],
      })
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Application Tracker Page Integration', () => {
  it('displays application columns', async () => {
    render(<Tracker />);
    // Wait for the columns to appear
    expect(await screen.findByText('Applied')).toBeInTheDocument();
    expect(await screen.findByText('5')).toBeInTheDocument();
    expect(await screen.findByText('Interview')).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(await screen.findByText('Offer')).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('handles loading state', async () => {
    // Override to simulate loading
    server.use(
      rest.get('/api/applications/board', (req, res, ctx) => {
        return res(ctx.delay(100)); // Simulate delay
      })
    );

    render(<Tracker />);
    // Should show loading states initially
    expect(screen.getByTestId(/skeleton/i)).toBeInTheDocument();
  });
});

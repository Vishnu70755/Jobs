import React from "react";
import { rest } from 'msw';
console.log('msw rest:', rest);
import { render, screen } from "@testing-library/react";
import { Jobs } from "@/pages/jobs";
import { setupServer } from "msw/node";

const handlers = [
  rest.get('/api/jobs', (req, res, ctx) => {
    return res(
      ctx.json({
        jobs: [
          {
            id: 1,
            title: "Software Engineer",
            company: "Tech Corp",
            location: "Remote",
            workMode: "remote",
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Job Search Page Integration', () => {
  it('displays job listings', async () => {
    render(<Jobs />);
    // Wait for the job to appear
    const jobTitle = await screen.findByText('Software Engineer');
    expect(jobTitle).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    // Override the handler for this test
    server.use(
      rest.get('/api/jobs', (req, res, ctx) => {
        return res(ctx.jobs([]));
      })
    );

    render(<Jobs />);
    expect(screen.getByText('No jobs found')).toBeInTheDocument();
  });
});

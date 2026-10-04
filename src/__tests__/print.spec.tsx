import { render, screen } from '@testing-library/react';
import { StoryPaper } from '../components/StoryPaper';
import { buildBodyHtml } from '../utils/storyGenerator';
it('renders a complete paper with photo, date, byline and escaped user copy', () => {
  const body = buildBodyHtml({ body: ['A <script>alert(1)</script> special day.'] } as any);
  const { container } = render(<StoryPaper headline="Family picnic" body={body} imageUrl="https://example.com/picnic.jpg" date="2026-04-16T12:00:00Z" byline="By Grandma" />);
  expect(screen.getByAltText('Family picnic')).toHaveAttribute('src', 'https://example.com/picnic.jpg');
  expect(screen.getByText('By Grandma')).toBeInTheDocument();
  expect(screen.getByText(/April 16, 2026/)).toBeInTheDocument();
  expect(screen.getByText('A <script>alert(1)</script> special day.')).toBeInTheDocument();
  expect(container.querySelector('script')).toBeNull();
  expect(screen.getByText('On This Day in History')).toBeInTheDocument();
});

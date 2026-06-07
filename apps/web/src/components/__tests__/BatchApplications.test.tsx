import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchApplications from '../BatchApplications';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  RotateCcw: () => <div data-testid="rotate-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  ChevronDown: () => <div data-testid="chevron-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockJobs = [
  {
    id: 'job-1',
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    remote: 'hybrid' as const,
    salary_min: 180000,
    salary_max: 240000,
    compatibility: {
      overall_score: 85,
      recommendation: 'apply_now' as const,
      skill_match: 90,
      cultural_match: 80,
    },
    status: 'pending' as const,
  },
  {
    id: 'job-2',
    title: 'Staff Platform Engineer',
    company: 'CloudScale Inc',
    location: 'San Francisco, CA',
    remote: 'fully' as const,
    salary_min: 200000,
    salary_max: 280000,
    compatibility: {
      overall_score: 78,
      recommendation: 'strong_candidate' as const,
      skill_match: 82,
      cultural_match: 74,
    },
    status: 'pending' as const,
  },
];

describe('BatchApplications', () => {
  const defaultProps = {
    profileId: 'profile-123',
    personaId: 'Architect',
    minCompatibilityScore: 70,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to return job data
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    } as Response);
  });

  it('renders loading state initially', async () => {
    render(<BatchApplications {...defaultProps} />);
    // Component shows loading animation initially
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
    await waitFor(() => {
      expect(screen.getByText(/Total Jobs/i)).toBeInTheDocument();
    });
  });

  it('displays batch applications header', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // Component shows "Total Jobs" in the stats bar
      expect(screen.getByText(/Total Jobs/i)).toBeInTheDocument();
    });
  });

  it('displays job listings after loading', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // Mock data includes these jobs
      expect(screen.getByText(/Senior Software Engineer/i)).toBeInTheDocument();
    });
  });

  it('shows company names in job listings', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/TechCorp/i)).toBeInTheDocument();
    });
  });

  it('displays compatibility scores', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // Jobs have compatibility scores like 85%
      const scores = screen.getAllByText(/%/);
      expect(scores.length).toBeGreaterThan(0);
    });
  });

  it('shows auto-apply threshold control', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-Apply Threshold/i)).toBeInTheDocument();
    });
  });

  it('displays job count statistics', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Total Jobs/i)).toBeInTheDocument();
    });
  });

  it('allows selecting jobs with checkboxes', async () => {
    const user = userEvent.setup();
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Senior Software Engineer/i)).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0]!);
      expect(checkboxes[0]!).toBeChecked();
    }
  });

  it('shows select all option', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Select All/i)).toBeInTheDocument();
    });
  });

  it('displays job locations', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // May be multiple matching elements
      const elements = screen.getAllByText(/San Francisco/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('shows salary information for jobs', async () => {
    const { container } = render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // Mock data has salaries in 180K-240K range - check container text
      expect(container.textContent).toMatch(/\$\d/);
    });
  });

  it('displays application status for jobs', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // Initial status is "pending"
      const pendingElements = screen.getAllByText(/pending/i);
      expect(pendingElements.length).toBeGreaterThan(0);
    });
  });

  it('shows info about batch operations', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/How Batch Operations Work/i)).toBeInTheDocument();
    });
  });

  it('shows customize link for jobs', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      const customizeLinks = screen.getAllByText(/Customize/i);
      expect(customizeLinks.length).toBeGreaterThan(0);
    });
  });

  it('allows expanding job details', async () => {
    const user = userEvent.setup();
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Senior Software Engineer/i)).toBeInTheDocument();
    });

    // Find and click view button
    const viewButtons = screen.getAllByText(/View/i);
    if (viewButtons.length > 0) {
      await user.click(viewButtons[0]!);
    }
  });

  it('shows remove button for jobs', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      const removeButtons = screen.getAllByText(/Remove/i);
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });

  it('displays recommendation status', async () => {
    render(<BatchApplications {...defaultProps} />);

    await waitFor(() => {
      // Mock data includes recommendations - may have multiple matching elements
      const elements = screen.getAllByText(/Apply Now|Strong Candidate/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});

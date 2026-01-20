import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import * as syncModule from '@/features/sync';

// Mock the sync module
vi.mock('@/features/sync', () => ({
  useSyncState: vi.fn(),
}));

describe('SyncStatusIndicator', () => {
  const mockUseSyncState = vi.mocked(syncModule.useSyncState);

  const createMockState = (
    combinedStatus: 'idle' | 'syncing' | 'error' | 'offline',
    lastSyncedAtFormatted: string
  ) => ({
    state: {
      isOnline: combinedStatus !== 'offline',
      isSyncing: combinedStatus === 'syncing',
      error: combinedStatus === 'error' ? new Error('Sync error') : null,
      lastSyncedAt: new Date(),
    },
    combinedStatus,
    lastSyncedAtFormatted,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Idle Status', () => {
    it('should render idle status correctly', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', '2分前'));

      render(<SyncStatusIndicator />);

      expect(screen.getByText('同期済み')).toBeInTheDocument();
    });

    it('should display last synced time when in idle status', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', '5分前'));

      render(<SyncStatusIndicator />);

      expect(screen.getByText('(5分前)')).toBeInTheDocument();
    });

    it('should not display time when showTime is false', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', '5分前'));

      render(<SyncStatusIndicator showTime={false} />);

      expect(screen.queryByText('(5分前)')).not.toBeInTheDocument();
      expect(screen.getByText('同期済み')).toBeInTheDocument();
    });

    it('should not display time when lastSyncedAtFormatted is empty', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      render(<SyncStatusIndicator />);

      expect(screen.getByText('同期済み')).toBeInTheDocument();
      expect(screen.queryByText(/分前/)).not.toBeInTheDocument();
    });

    it('should render check icon for idle status', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      const { container } = render(<SyncStatusIndicator />);
      const icon = container.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon?.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('Syncing Status', () => {
    it('should render syncing status correctly', () => {
      mockUseSyncState.mockReturnValue(createMockState('syncing', ''));

      render(<SyncStatusIndicator />);

      expect(screen.getByText('同期中...')).toBeInTheDocument();
    });

    it('should not display time during syncing', () => {
      mockUseSyncState.mockReturnValue(createMockState('syncing', '1分前'));

      render(<SyncStatusIndicator />);

      expect(screen.queryByText('(1分前)')).not.toBeInTheDocument();
    });

    it('should render sync icon with spin class', () => {
      mockUseSyncState.mockReturnValue(createMockState('syncing', ''));

      const { container } = render(<SyncStatusIndicator />);
      const icon = container.querySelector('svg');

      expect(icon).toBeInTheDocument();
      expect(icon?.classList.toString()).toMatch(/spin/);
    });
  });

  describe('Error Status', () => {
    it('should render error status correctly', () => {
      mockUseSyncState.mockReturnValue(createMockState('error', ''));

      render(<SyncStatusIndicator />);

      expect(screen.getByText('同期エラー')).toBeInTheDocument();
    });

    it('should not display time during error', () => {
      mockUseSyncState.mockReturnValue(createMockState('error', '3分前'));

      render(<SyncStatusIndicator />);

      expect(screen.queryByText('(3分前)')).not.toBeInTheDocument();
    });

    it('should render error icon', () => {
      mockUseSyncState.mockReturnValue(createMockState('error', ''));

      const { container } = render(<SyncStatusIndicator />);
      const icon = container.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });
  });

  describe('Offline Status', () => {
    it('should render offline status correctly', () => {
      mockUseSyncState.mockReturnValue(createMockState('offline', ''));

      render(<SyncStatusIndicator />);

      expect(screen.getByText('オフライン')).toBeInTheDocument();
    });

    it('should not display time when offline', () => {
      mockUseSyncState.mockReturnValue(createMockState('offline', '10分前'));

      render(<SyncStatusIndicator />);

      expect(screen.queryByText('(10分前)')).not.toBeInTheDocument();
    });

    it('should render offline icon', () => {
      mockUseSyncState.mockReturnValue(createMockState('offline', ''));

      const { container } = render(<SyncStatusIndicator />);
      const icon = container.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply status-specific class for idle', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      const { container } = render(<SyncStatusIndicator />);
      const statusContainer = container.firstChild as HTMLElement;

      expect(statusContainer.className).toMatch(/idle/);
    });

    it('should apply status-specific class for syncing', () => {
      mockUseSyncState.mockReturnValue(createMockState('syncing', ''));

      const { container } = render(<SyncStatusIndicator />);
      const statusContainer = container.firstChild as HTMLElement;

      expect(statusContainer.className).toMatch(/syncing/);
    });

    it('should apply status-specific class for error', () => {
      mockUseSyncState.mockReturnValue(createMockState('error', ''));

      const { container } = render(<SyncStatusIndicator />);
      const statusContainer = container.firstChild as HTMLElement;

      expect(statusContainer.className).toMatch(/error/);
    });

    it('should apply status-specific class for offline', () => {
      mockUseSyncState.mockReturnValue(createMockState('offline', ''));

      const { container } = render(<SyncStatusIndicator />);
      const statusContainer = container.firstChild as HTMLElement;

      expect(statusContainer.className).toMatch(/offline/);
    });

    it('should apply custom className when provided', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      const { container } = render(<SyncStatusIndicator className="custom-class" />);
      const statusContainer = container.firstChild as HTMLElement;

      expect(statusContainer.className).toContain('custom-class');
    });
  });

  describe('Component Structure', () => {
    it('should render container div', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      const { container } = render(<SyncStatusIndicator />);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('should render icon span', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      const { container } = render(<SyncStatusIndicator />);
      const iconSpan = container.querySelector('span:first-child');

      expect(iconSpan).toBeInTheDocument();
    });

    it('should render text span', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', ''));

      const { container } = render(<SyncStatusIndicator />);
      const textSpans = container.querySelectorAll('span');

      expect(textSpans.length).toBeGreaterThanOrEqual(2);
    });

    it('should render time span when applicable', () => {
      mockUseSyncState.mockReturnValue(createMockState('idle', '1分前'));

      const { container } = render(<SyncStatusIndicator />);
      const spans = container.querySelectorAll('span');

      expect(spans.length).toBe(3);
    });
  });

  describe('Icon Rendering', () => {
    it('should render SVG elements for all status icons', () => {
      const statuses: Array<'idle' | 'syncing' | 'error' | 'offline'> = [
        'idle',
        'syncing',
        'error',
        'offline',
      ];

      statuses.forEach((status) => {
        mockUseSyncState.mockReturnValue(createMockState(status, ''));

        const { container } = render(<SyncStatusIndicator />);
        const svg = container.querySelector('svg');

        expect(svg).toBeInTheDocument();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 16 16');
        expect(svg?.getAttribute('fill')).toBe('currentColor');
      });
    });
  });
});

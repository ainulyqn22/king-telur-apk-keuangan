// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ViewErrorBoundary, ViewLoadingFallback } from './ViewBoundary';

function BrokenView(): never {
  throw new Error('module failure');
}

describe('view loading and error states', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('announces lazy module loading', () => {
    render(<ViewLoadingFallback />);

    expect(screen.getByRole('status')).toHaveTextContent('Memuat modul HouseERP');
  });

  it('isolates a failed module behind a recoverable error screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ViewErrorBoundary viewName="Laporan">
        <BrokenView />
      </ViewErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Modul gagal dimuat');
    expect(screen.getByRole('button', { name: 'Muat ulang aplikasi' })).toBeEnabled();
  });
});

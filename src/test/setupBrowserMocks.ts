/* eslint-disable @typescript-eslint/no-explicit-any */

type MaybeFileReaderEvent = ProgressEvent<FileReader> | null;

const DEFAULT_DATA_URL = 'data:image/png;base64,AAA';

export function mockBrowserFilePipeline(): void {
  if (typeof window.URL === 'undefined') {
    (window as any).URL = {};
  }

  const urlRef = window.URL as {
    createObjectURL?: (blob: Blob) => string;
    revokeObjectURL?: (value: string) => void;
  };

  urlRef.createObjectURL = jest.fn(() => 'blob://test-url');
  urlRef.revokeObjectURL = jest.fn();

  class MockFileReader implements Partial<FileReader> {
    public onload: ((event: MaybeFileReaderEvent) => void) | null = null;
    public onerror: ((event: MaybeFileReaderEvent) => void) | null = null;

    readAsDataURL(): void {
      setTimeout(() => {
        if (this.onload) {
          this.onload({
            target: { result: DEFAULT_DATA_URL },
          } as unknown as ProgressEvent<FileReader>);
        }
      }, 0);
    }

    addEventListener(): void {
      // no-op
    }

    removeEventListener(): void {
      // no-op
    }
  }

  (window as any).FileReader = MockFileReader;
}

export function useFakeTimers(): void {
  jest.useFakeTimers();
}

export async function runAllTimersAndMicrotasks(): Promise<void> {
  jest.runAllTimers();
  // Flush pending microtasks scheduled during timer callbacks
  await Promise.resolve();
}

export function useRealTimers(): void {
  jest.useRealTimers();
}

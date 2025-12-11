import React from 'react';
import { render, cleanup } from '@testing-library/react';
import Items from '../Items';
import { DataProvider } from '../../state/DataContext';

// Use fake timers so we can deterministically resolve the delayed fetch
jest.useFakeTimers();

afterEach(() => {
  jest.clearAllTimers();
  cleanup();
  jest.restoreAllMocks();
});

test('does not update state after unmount (fetch aborted)', async () => {
  // Spy on console.error so we can detect React warnings
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Mock global.fetch to respect AbortSignal and resolve after a timeout
  global.fetch = jest.fn((url, { signal } = {}) => {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        reject(new DOMException('Aborted', 'AbortError'));
      };

      if (signal) signal.addEventListener('abort', onAbort);

      setTimeout(() => {
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve({ json: async () => ({ data: [{ id: 1, name: 'Test Item' }] }) });
      }, 100);
    });
  });

  const { unmount } = render(
    <DataProvider>
      <Items />
    </DataProvider>
  );

  // Immediately unmount to simulate the component going away before fetch resolves
  unmount();

  // Fast-forward timers to let the mocked fetch either resolve or be aborted
  jest.runAllTimers();

  // If the app attempted to update state on an unmounted component React would log an error
  const hadUnmountedStateUpdateWarning = consoleErrorSpy.mock.calls.some((call) =>
    call.join(' ').includes("Can't perform a React state update on an unmounted component")
  );

  expect(hadUnmountedStateUpdateWarning).toBe(false);
});

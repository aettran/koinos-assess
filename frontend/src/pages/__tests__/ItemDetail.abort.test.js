import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ItemDetail from '../ItemDetail';

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllTimers();
  cleanup();
  jest.restoreAllMocks();
});

test('does not throw runtime errors when fetch is aborted on unmount', async () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Mock fetch to respect AbortSignal and resolve after a timeout
  global.fetch = jest.fn((url, { signal } = {}) => {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        const e = new Error('Aborted');
        e.name = 'AbortError';
        reject(e);
      };

      if (signal) signal.addEventListener('abort', onAbort);

      setTimeout(() => {
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve({ ok: true, json: async () => ({ id: 1, name: 'Test Item', category: 'X', price: 1 }) });
      }, 100);
    });
  });

  const rendered = render(
    <MemoryRouter initialEntries={["/items/1"]}>
      <Routes>
        <Route path="/items/:id" element={<ItemDetail />} />
      </Routes>
    </MemoryRouter>
  );

  // Immediately unmount to simulate navigation away before fetch resolves
  rendered.unmount();

  // Fast-forward timers so the mocked fetch would either resolve or be aborted
  jest.runAllTimers();

  // Ensure no runtime error was logged that indicates reading properties of null
  const hadNullReadError = consoleErrorSpy.mock.calls.some(call =>
    call.join(' ').includes("Cannot read properties of null") ||
    call.join(' ').includes("Can't perform a React state update on an unmounted component")
  );

  expect(hadNullReadError).toBe(false);
});

import React, { useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAsync } from './useAsync';

test('inline request callback does not refetch on rerender', async () => {
  const request = jest.fn(async () => ['employee']);
  function Fixture() {
    const [count, setCount] = useState(0);
    const { data, isLoading } = useAsync(() => request());
    return <><button onClick={() => setCount(count + 1)}>Rerender {count}</button>
      <span>{isLoading ? 'Loading' : data?.[0]}</span></>;
  }
  render(<Fixture />);
  expect(await screen.findByText('employee')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Rerender/ }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
});

test('failed immediate request shows an error without an unhandled rejection', async () => {
  function Fixture() {
    const { error } = useAsync(() => Promise.reject(new Error('Unavailable')));
    return <span>{error?.message}</span>;
  }
  render(<Fixture />);
  expect(await screen.findByText('Unavailable')).toBeInTheDocument();
});

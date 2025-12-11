import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Accepts optional parameters for pagination/search and an optional
  // AbortSignal so callers (components) can cancel in-flight requests.
  const fetchItems = useCallback(
    async ({ limit = 10, page = 1, q = '', signal } = {}) => {
      const url = `http://localhost:3001/api/items?limit=${limit}&page=${page}&q=${encodeURIComponent(
        q
      )}`;
      const res = await fetch(url, { signal });
      const json = await res.json();
      // API returns { data: [...], total } for paginated responses.
      setItems(json.data || json);
      setTotal(json.total || (Array.isArray(json) ? json.length : 0));
    },
    []
  );

  return (
    <DataContext.Provider value={{ items, total, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
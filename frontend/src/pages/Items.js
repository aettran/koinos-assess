import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import './Items.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Items() {
  const { items, total, fetchItems } = useData();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchItems({ limit, page, signal: controller.signal })
      .catch((err) => {
        if (err && err.name === 'AbortError') return;
        console.error(err);
      })
      .finally(() => {
        if (controller.signal && controller.signal.aborted) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [fetchItems, page]);

  /*
    Change explanation:
    - Replaced the previous `active` flag pattern with an AbortController.
    - The `DataContext.fetchItems` now accepts an AbortSignal and passes it
      to `fetch`. When the component unmounts we call `controller.abort()` to
      cancel the request. This prevents state updates after unmount and
      avoids memory leaks and React warnings.
  */

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // responsive page count: show fewer page buttons on smaller screens
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === 'undefined') return 7;
    const w = window.innerWidth;
    if (w < 540) return 1;
    if (w < 900) return 3;
    if (w < 1200) return 5;
    return 7;
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      let c = 7;
      if (w < 540) c = 1;
      else if (w < 900) c = 3;
      else if (w < 1200) c = 5;
      else c = 7;
      setVisibleCount(c);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // build a concise page list with optional ellipses
  const getPageList = (totalPages, current, visible) => {
    if (totalPages <= visible + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    let left = Math.max(2, current - Math.floor(visible / 2));
    let right = Math.min(totalPages - 1, left + visible - 1);
    left = Math.max(2, right - visible + 1);

    if (left > 2) pages.push('left-ellipsis');

    for (let i = left; i <= right; i++) pages.push(i);

    if (right < totalPages - 1) pages.push('right-ellipsis');

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="items-container">
      <div className="items-header">
        <h1 className="items-title">Items</h1>
        <div className="items-info">
          {loading ? (
            <span className="items-loading">Loading…</span>
          ) : (
            <span className="items-meta">Showing page {page} of {totalPages}</span>
          )}
        </div>
      </div>

      <ul className="items-list">
        {items.map(item => (
          <li className="items-list__item" key={item.id}>
            <Link className="items-list__link" to={'/items/' + item.id}>
              {item.img && (
                <div className="items-list__img" dangerouslySetInnerHTML={{ __html: item.img }} />
              )}
              <div className="items-list__title">{item.name}</div>
              <div className="items-list__meta">{item.category} • ${item.price}</div>
            </Link>
          </li>
        ))}
      </ul>

      <nav className="pagination" aria-label="Pagination">
        <button
          className="pagination__btn"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>

        <div className="pagination__pages">
          {getPageList(totalPages, page, visibleCount).map((p, idx) => {
            if (p === 'left-ellipsis' || p === 'right-ellipsis') {
              return (
                <button key={p + idx} className="pagination__btn" disabled aria-hidden>
                  …
                </button>
              );
            }

            return (
              <button
                key={p}
                className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
                onClick={() => goToPage(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          className="pagination__btn"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

export default Items;
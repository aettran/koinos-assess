import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Use an AbortController to avoid updating state after unmount
    const controller = new AbortController();
    const signal = controller.signal;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        // Use explicit backend URL to avoid proxy/CORS ambiguity in dev
        const res = await fetch(`http://localhost:3001/api/items/${id}`, { signal });
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to load item');
        }
        const json = await res.json();
        // Ensure the response is a usable object. Some environments or
        // misconfigured proxies may return an empty body which would lead
        // to `item` being null and the component attempting to read its
        // properties (causing the runtime TypeError you saw). Validate
        // before setting state and surface an error otherwise.
        if (!json || typeof json !== 'object') {
          setError('Invalid item data received');
          return;
        }
        setItem(json);
      } catch (err) {
        if (err.name === 'AbortError') return; // expected on unmount
        setError(err.message || 'Unknown error');
      } finally {
        // If the request was aborted, avoid touching state here. The
        // component may be unmounting and updating `loading` to false can
        // lead to a render where `item` is still null which causes runtime
        // errors. Check the signal before updating state.
        if (signal && signal.aborted) return;
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [id]);

  // Render states instead of immediately redirecting back to the list.
  if (loading) {
    return (
      <div className="item-detail-container">
        <button className="item-detail-back" disabled aria-label="Back to items">
          <FiArrowLeft aria-hidden="true" />
          Back
        </button>

        <div className="item-detail-card">
          <div className="item-detail-img">
            <div className="skeleton skeleton-img"></div>
          </div>

          <div className="item-detail-content">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-meta"></div>
            <div className="skeleton skeleton-meta" style={{ marginTop: 8 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="item-detail-container">
        <button className="item-detail-back" onClick={() => navigate('/items')} aria-label="Back to items">
          <FiArrowLeft aria-hidden="true" />
          Back
        </button>
        <p className="item-detail-error">Item not found.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-container">
        <button className="item-detail-back" onClick={() => navigate('/')} aria-label="Back to items">
          <FiArrowLeft aria-hidden="true" />
          Back
        </button>
        <p className="item-detail-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="item-detail-container">
      <button className="item-detail-back" onClick={() => navigate('/')} aria-label="Back to items">
        <FiArrowLeft aria-hidden="true" />
        Back
      </button>

      <div className="item-detail-card">
        {item.img && (
          <div className="item-detail-img">
            <div dangerouslySetInnerHTML={{ __html: item.img }} />
          </div>
        )}

        <div className="item-detail-content">
          <h1 className="item-detail-title">{item.name}</h1>

          <div className="item-detail-meta">
            <span className="item-detail-category">{item.category}</span>
            <span className="item-detail-price">${item.price}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
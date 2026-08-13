'use client';

import { useRef, useState } from 'react';

const currencyFormatters = {};

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined) return '—';
  const code = currency || 'USD';
  if (!currencyFormatters[code]) {
    currencyFormatters[code] = new Intl.NumberFormat('en-GB', { style: 'currency', currency: code });
  }
  try {
    return currencyFormatters[code].format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

export default function UploadForm({ initialExtractions }) {
  const [extractions, setExtractions] = useState(initialExtractions);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed.');
      setExtractions((current) => [data, ...current]);
      setExpandedId(data.id);
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('idle');
    }
  }

  return (
    <>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input ref={fileInputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required />
        <button type="submit" disabled={status === 'uploading'}>
          {status === 'uploading' ? 'Extracting…' : 'Extract invoice'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      <section className="results">
        {extractions.length === 0 && <p className="empty-state">No extractions yet — upload an invoice above.</p>}

        {extractions.map((ex) => (
          <article key={ex.id} className="result-card">
            <button
              type="button"
              className="result-summary"
              onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
            >
              <div>
                <div className="result-vendor">{ex.vendorName || 'Unknown vendor'}</div>
                <div className="result-meta">
                  {ex.invoiceNumber || 'No invoice #'} · {ex.invoiceDate || 'No date'} · {ex.fileName}
                </div>
              </div>
              <div className="result-total">{formatMoney(ex.total, ex.currency)}</div>
            </button>

            {expandedId === ex.id && (
              <table className="line-items">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.lineItems?.length ? (
                    ex.lineItems.map((item, i) => (
                      <tr key={i}>
                        <td>{item.description}</td>
                        <td>{item.quantity ?? '—'}</td>
                        <td>{formatMoney(item.unitPrice, ex.currency)}</td>
                        <td>{formatMoney(item.amount, ex.currency)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>No line items extracted.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </article>
        ))}
      </section>
    </>
  );
}

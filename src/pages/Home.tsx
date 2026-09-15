import React, { useEffect, useState } from 'react';
import type { HealthCheckResponse } from '../contracts/index.js';
import { apiFetch } from '../lib/api.js';

export const Home: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthCheckResponse) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Falha ao conectar com a API');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '480px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e4e4e7', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Zen Casamento</h1>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.25rem' }}>
          Fundação Técnica — M1 (Tela Técnica Temporária)
        </p>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section style={{ padding: '1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Status da API & Banco</h2>
          {loading && <p style={{ fontSize: '0.875rem', color: '#71717a' }}>Verificando conexão...</p>}
          {error && (
            <p style={{ fontSize: '0.875rem', color: '#ef4444' }}>
              <strong>Erro:</strong> {error}
            </p>
          )}
          {health && (
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <p>
                <strong>Status Geral:</strong>{' '}
                <span style={{ color: health.status === 'ok' ? '#22c55e' : '#ef4444' }}>{health.status}</span>
              </p>
              <p>
                <strong>PostgreSQL:</strong>{' '}
                <span style={{ color: health.services.database === 'up' ? '#22c55e' : '#ef4444' }}>
                  {health.services.database}
                </span>
              </p>
              <p style={{ color: '#71717a', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Timestamp: {health.timestamp}
              </p>
            </div>
          )}
        </section>

        <section style={{ padding: '1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>PWA</h2>
          <p style={{ fontSize: '0.875rem', color: '#71717a' }}>
            Service Worker e manifesto PWA configurados via vite-plugin-pwa.
          </p>
        </section>
      </main>
    </div>
  );
};

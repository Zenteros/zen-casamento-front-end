import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monogram } from '../components/Monogram.js';
import { apiFetch } from '../lib/api.js';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verificar se já possui sessão administrativa ativa
  useEffect(() => {
    let isMounted = true;
    const checkMe = async () => {
      try {
        const res = await apiFetch('/api/v1/admin/auth/me', {
          method: 'GET',
        });
        if (res.ok && isMounted) {
          navigate('/admin', { replace: true });
        }
      } catch {
        // Ignora erro de rede na checagem inicial
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };
    checkMe();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await apiFetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas. Verifique os dados e tente novamente.');
      }

      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Falha ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="admin-loading-screen">
        <Monogram variant="pill" size="md" />
        <p className="admin-loading-text">Verificando sessão administrativa...</p>
      </div>
    );
  }

  return (
    <div className="admin-auth-page animate-fade-in">
      <div className="admin-auth-card">
        <div className="admin-auth-card__header">
          <div className="admin-auth-card__monogram">
            <Monogram variant="pill" size="sm" />
          </div>
          <span className="admin-auth-card__tag">Painel dos Noivos</span>
          <h1 className="admin-auth-card__title">Acesso Administrativo</h1>
          <p className="admin-auth-card__subtitle">
            Patrício &amp; Evandria &bull; 21.11.2026
          </p>
        </div>

        {errorMessage && (
          <div className="admin-alert admin-alert--error animate-fade-in" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-auth-form" noValidate>
          <div className="admin-form-group">
            <label htmlFor="admin-email" className="admin-label">
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password" className="admin-label">
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <>
                <span className="admin-spinner" aria-hidden="true" />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        <div className="admin-auth-footer">
          <p>Área restrita e segura aos noivos e cerimonial.</p>
        </div>
      </div>
    </div>
  );
};

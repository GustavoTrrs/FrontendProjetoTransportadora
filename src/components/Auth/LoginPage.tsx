import React, { useState } from 'react';
import { Truck, Mail, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { authApi } from '../../api/client';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const data = await authApi.login({ email, password });
        onLoginSuccess(data.access_token);
      } else {
        await authApi.signup({ email, password });
        setIsLogin(true);
        setError('Conta criada com sucesso! Por favor, faça login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '2rem'
    }}>
      <div className="login-card glass" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem',
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            width: '70px', 
            height: '70px', 
            background: 'var(--primary)', 
            borderRadius: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 20px rgba(215, 25, 33, 0.2)'
          }}>
            <Truck color="white" size={35} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>TransCarga</h1>
          <p style={{ color: 'var(--text-muted)' }}>Portal Logístico de Elite</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Mail size={16} /> E-mail Corporativo
            </label>
            <input 
              type="email" 
              placeholder="admin@transcarga.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Lock size={16} /> Senha
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: error.includes('sucesso') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(215, 25, 33, 0.1)', 
              color: error.includes('sucesso') ? '#10b981' : 'var(--primary)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: `1px solid ${error.includes('sucesso') ? '#10b981' : 'var(--primary)'}`
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '1.25rem', justifyContent: 'center' }}
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Criar Conta')}
            {!loading && (isLogin ? <LogIn size={20} style={{ marginLeft: '0.5rem' }} /> : <UserPlus size={20} style={{ marginLeft: '0.5rem' }} />)}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
          >
            {isLogin ? 'Não tem acesso? Solicite agora' : 'Já possui conta? Faça login'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

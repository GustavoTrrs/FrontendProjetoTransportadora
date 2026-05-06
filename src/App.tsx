import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, LayoutDashboard, Truck, MapPin, Weight, X, 
  Edit2, Trash2, Clock, FileText, BarChart3, TrendingUp, 
  PackageCheck, LogIn
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { freteApi } from './api/client';
import type { Frete } from './api/client';

import './App.css';
import LoginPage from './components/Auth/LoginPage';

const COLORS = ['#D71921', '#B28D35', '#121212', '#6B7280', '#E5E7EB'];

function App() {
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fretes'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  const [formData, setFormData] = useState({
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    logradouro: '',
    numero: '',
    peso: 0,
    transportadora: '',
    descricao: ''
  });
  const [editingFrete, setEditingFrete] = useState<Frete | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [freteIdToDelete, setFreteIdToDelete] = useState<number | null>(null);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalWeight = fretes.reduce((acc, f) => acc + f.peso, 0);
    const carriers = new Set(fretes.map(f => f.transportadora)).size;
    const states = new Set(fretes.map(f => f.estado)).size;
    return {
      totalFretes: fretes.length,
      totalWeight: totalWeight,
      carriers,
      states
    };
  }, [fretes]);

  const formatWeight = (kg: number) => {
    if (kg >= 10000) {
      return `${(kg / 1000).toFixed(1)} t`;
    }
    return `${kg.toFixed(1)} kg`;
  };

  const getTrackingId = (id: number) => {
    // Generates a consistent 6-digit "random-looking" ID based on the real ID
    return (id * 137 + 5281) % 900000 + 100000;
  };

  // Chart Data: Volume by State
  const stateData = useMemo(() => {
    const data: Record<string, number> = {};
    fretes.forEach(f => {
      if (f.estado) data[f.estado] = (data[f.estado] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [fretes]);

  // Chart Data: Carrier Distribution
  const carrierData = useMemo(() => {
    const data: Record<string, number> = {};
    fretes.forEach(f => {
      data[f.transportadora] = (data[f.transportadora] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [fretes]);

  const recentFretes = useMemo(() => {
    return [...fretes]
      .sort((a, b) => b.id - a.id) // Sort by ID descending (most recent first)
      .slice(0, 4);
  }, [fretes]);

  const carrierIndices = useMemo(() => {
    const counts: Record<string, number> = {};
    return [...fretes]
      .sort((a, b) => a.id - b.id)
      .reduce((acc, frete) => {
        counts[frete.transportadora] = (counts[frete.transportadora] || 0) + 1;
        acc[frete.id] = counts[frete.transportadora];
        return acc;
      }, {} as Record<number, number>);
  }, [fretes]);

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const loadFretes = async () => {
    try {
      const data = await freteApi.list();
      setFretes(data);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadFretes();
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFrete) {
        await freteApi.update(editingFrete.id, formData);
      } else {
        await freteApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingFrete(null);
      resetForm();
      loadFretes();
    } catch (error) {
      alert('Erro ao processar frete');
    }
  };

  const resetForm = () => {
    setFormData({
      cep: '', estado: '', cidade: '', bairro: '',
      logradouro: '', numero: '', peso: 0,
      transportadora: '', descricao: ''
    });
  };

  const handleEdit = (frete: Frete) => {
    setEditingFrete(frete);
    setFormData({
      cep: frete.cep || '',
      estado: frete.estado || '',
      cidade: frete.cidade || '',
      bairro: frete.bairro || '',
      logradouro: frete.logradouro || '',
      numero: frete.numero || '',
      peso: frete.peso,
      transportadora: frete.transportadora,
      descricao: frete.descricao || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setFreteIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (freteIdToDelete !== null) {
      try {
        await freteApi.delete(freteIdToDelete);
        setIsDeleteModalOpen(false);
        setFreteIdToDelete(null);
        loadFretes();
      } catch (error) {
        alert('Erro ao excluir frete');
      }
    }
  };

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <Truck className="text-primary" size={32} strokeWidth={2.5} />
          <span className="gradient-text">TransCarga</span>
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'fretes' ? 'active' : ''}`}
            onClick={() => setActiveTab('fretes')}
          >
            <PackageCheck size={20} />
            Fretes
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <button 
            className="nav-item" 
            onClick={handleLogout}
            style={{ color: '#ef4444' }}
          >
            <LogIn size={20} style={{ transform: 'rotate(180deg)' }} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <div className="premium-badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
              Corporate Logistics Portal
            </div>
            <h1>{activeTab === 'dashboard' ? 'Visão Geral de Operações' : 'Gerenciamento de Fretes'}</h1>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            Novo Frete
          </button>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <PackageCheck className="text-primary" size={24} />
                  <TrendingUp size={16} color="#10b981" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.totalFretes}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total de Fretes</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <Weight className="text-primary" size={24} />
                  <TrendingUp size={16} color="#10b981" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatWeight(Number(stats.totalWeight))}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Peso Total</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <Truck className="text-primary" size={24} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.carriers}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Transportadoras</div>
              </div>
              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <MapPin className="text-primary" size={24} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.states}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Estados Atendidos</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              <div className="chart-container">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={20} className="text-primary" /> Volume por Estado
                </h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" fill="#D71921" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-container">
                <h3 style={{ marginBottom: '1.5rem' }}>Distribuição</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={carrierData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {carrierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Fretes Recentes</h2>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                onClick={() => setActiveTab('fretes')}
              >
                Ver Todos
              </button>
            </div>
            
            <div className="frete-grid">
              {recentFretes.map((frete, index) => (
                <div key={frete.id} className="frete-card glass" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="card-title">{frete.transportadora} #{carrierIndices[frete.id]}</h3>
                      <div className="premium-badge">REF-{getTrackingId(frete.id)}</div>
                    </div>
                  </div>
                  <div className="card-info">
                    <div className="info-item" style={{ alignItems: 'flex-start' }}>
                      <MapPin size={18} className="text-primary" style={{ marginTop: '0.2rem' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destino</div>
                        <span style={{ fontSize: '0.9rem' }}>
                          {frete.logradouro}, {frete.numero}<br />
                          {frete.bairro} - {frete.cidade}/{frete.estado}<br />
                          CEP: {frete.cep}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <Weight size={18} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carga</div>
                        <span>{formatWeight(frete.peso)}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FileText size={18} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detalhes</div>
                        <span style={{ fontSize: '0.85rem' }}>{frete.descricao || 'Nenhuma observação extra.'}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <Clock size={18} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registro</div>
                        <span style={{ fontSize: '0.8rem' }}>{new Date(frete.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn" onClick={() => handleEdit(frete)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(frete.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="frete-grid">
            {loading ? (
              <p>Carregando...</p>
            ) : (
              fretes.map((frete, index) => (
                <div key={frete.id} className="frete-card glass" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="card-title">{frete.transportadora} #{carrierIndices[frete.id]}</h3>
                      <div className="premium-badge">REF-{getTrackingId(frete.id)}</div>
                    </div>
                  </div>
                  
                  <div className="card-info">
                    <div className="info-item" style={{ alignItems: 'flex-start' }}>
                      <MapPin size={18} className="text-primary" style={{ marginTop: '0.2rem' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destino</div>
                        <span style={{ fontSize: '0.9rem' }}>
                          {frete.logradouro}, {frete.numero}<br />
                          {frete.bairro} - {frete.cidade}/{frete.estado}<br />
                          CEP: {frete.cep}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <Weight size={18} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carga</div>
                        <span>{formatWeight(frete.peso)}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FileText size={18} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detalhes</div>
                        <span style={{ fontSize: '0.85rem' }}>{frete.descricao || 'Nenhuma observação extra.'}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <Clock size={18} className="text-primary" />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registro</div>
                        <span style={{ fontSize: '0.8rem' }}>{new Date(frete.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button className="action-btn" onClick={() => handleEdit(frete)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(frete.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="card-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.75rem' }}>
                  {editingFrete ? 'Editar Frete' : 'Novo Frete de Carga'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Complete os detalhes logísticos abaixo.</p>
              </div>
              <div className="modal-close-btn" onClick={() => { setIsModalOpen(false); setEditingFrete(null); resetForm(); }}>
                <X size={24} />
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>CEP de Destino</label>
                  <input 
                    type="text" 
                    placeholder="00000-000" 
                    value={formData.cep}
                    onChange={(e) => setFormData({...formData, cep: e.target.value})}
                    onBlur={handleCepBlur}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>UF</label>
                  <input 
                    type="text" 
                    placeholder="Ex: SP" 
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Cidade</label>
                  <input 
                    type="text" 
                    placeholder="Ex: São Paulo" 
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bairro</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Centro" 
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Logradouro</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Av. Paulista" 
                    value={formData.logradouro}
                    onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Número</label>
                  <input 
                    type="text" 
                    placeholder="123" 
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Peso da Carga (kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.peso}
                    onChange={(e) => setFormData({...formData, peso: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transportadora Especializada</label>
                  <input 
                    type="text" 
                    placeholder="Ex: TransLog Premium" 
                    value={formData.transportadora}
                    onChange={(e) => setFormData({...formData, transportadora: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                <label>Observações e Descrição</label>
                <textarea 
                  placeholder="Instruções especiais de manuseio..." 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows={4}
                  style={{ minHeight: '120px' }}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn-primary" style={{ minWidth: '240px' }}>
                  {editingFrete ? 'Confirmar Edição' : 'Registrar Frete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Exclusão */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ maxWidth: '400px', textAlign: 'center', padding: '3rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '60px', height: '60px', background: 'rgba(215, 25, 33, 0.1)', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', margin: '0 auto 1.5rem' 
              }}>
                <Trash2 size={30} color="#D71921" />
              </div>
              <h2 className="card-title" style={{ color: '#D71921' }}>Excluir Registro?</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
              Esta operação irá remover permanentemente o registro do nosso sistema logístico.
            </p>
            
            <div className="form-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                style={{ background: '#D71921', flex: 1 }}
                onClick={confirmDelete}
              >
                Excluir
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => { setIsDeleteModalOpen(false); setFreteIdToDelete(null); }}
                style={{ flex: 1 }}
              >
                Manter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

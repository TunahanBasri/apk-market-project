import { useState, useEffect } from 'react';
import api from '../api/axios'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Market() {
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [balance, setBalance] = useState(user.balance || 0);
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchApps();
    fetchCategories();
    setBalance(user.balance || 0);
  }, []);

  const fetchApps = async () => {
    try {
      const response = await api.get('/apps');
      setApps(response.data);
      setLoading(false);
    } catch (error) { toast.error("Uygulamalar yüklenemedi."); }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/apps/categories');
      setCategories(response.data);
    } catch (error) { console.error("Kategoriler çekilemedi"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredApps = apps.filter(app => {
    if (selectedFilter === 'ALL') return true;
    return app.categories?.some(cat => cat.id == selectedFilter);
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px', color: '#1a73e8', fontWeight: 'bold' }}>
      🚀 Market Yükleniyor...
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, color: '#1a73e8', fontSize: '26px', cursor: 'pointer', fontWeight: '800' }} onClick={() => navigate('/market')}>🚀 APK MARKET</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* 🎒 ENVANTER BUTONU */}
          <button 
            onClick={() => navigate('/inventory')} 
            style={{ backgroundColor: '#fff', color: '#1a73e8', border: '1px solid #1a73e8', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
            onMouseOver={e => e.target.style.backgroundColor = '#e7f3ff'}
            onMouseOut={e => e.target.style.backgroundColor = '#fff'}
          >
            🎒 Envanterim
          </button>

          {/* ⚙️ UYGULAMA EKLE PANELİ (SADECE ADMIN) */}
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')} 
              style={{ backgroundColor: '#fbbc04', color: '#202124', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(251, 188, 4, 0.3)' }}>
              ⚙️ Uygulama Ekle
            </button>
          )}

          {/* 💰 BAKİYE */}
          <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px 18px', borderRadius: '15px', fontWeight: '800', border: '1px solid #c8e6c9' }}>
            💰 {balance.toFixed(2)} ₺
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #ddd', paddingLeft: '15px' }}>
            <span style={{fontSize: '14px'}}>Selam, <b>{user.username}</b></span>
            <button onClick={handleLogout} style={{ padding: '8px 12px', color: '#dc3545', border: '1px solid #dc3545', background: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Çıkış</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1240px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* FİLTRELEME */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
          <h2 style={{ color: '#202124', margin: 0, fontSize: '26px', fontWeight: '800' }}>📦 Uygulama Vitrini</h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            <button onClick={() => setSelectedFilter('ALL')} style={getFilterBtnStyle(selectedFilter === 'ALL')}>Tümü</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedFilter(cat.id)} style={getFilterBtnStyle(selectedFilter == cat.id, true)}>{cat.name}</button>
            ))}
          </div>
        </div>

        {/* LİSTELEME */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {filteredApps.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#888', backgroundColor: '#fff', borderRadius: '20px', border: '1px dashed #ccc' }}>
              Henüz bu kategoride uygulama bulunamadı. 🔍
            </div>
          ) : (
            filteredApps.map((app) => (
              <div 
                key={app.id} 
                style={cardStyle} 
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                }} 
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ height: '190px', overflow: 'hidden', position: 'relative' }}>
                  <img src={app.imageUrl || `https://via.placeholder.com/400x200?text=${app.name}`} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {app.categories?.[0] && <span style={badgeStyle}>{app.categories[0].name}</span>}
                  <span style={versionStyle}>v{app.version}</span>
                </div>
                <div style={{ padding: '25px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', color: '#202124', fontWeight: '700' }}>{app.name}</h3>
                  <p style={{ color: '#5f6368', fontSize: '14px', height: '42px', overflow: 'hidden', lineHeight: '1.5', marginBottom: '15px' }}>{app.description}</p>
                  <button onClick={() => navigate(`/app/${app.id}`)} style={primaryBtnStyle}>
                    Hemen İncele
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Stiller
const cardStyle = { 
  backgroundColor: 'white', 
  borderRadius: '25px', 
  overflow: 'hidden', 
  boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  cursor: 'default'
};

const badgeStyle = { 
  position: 'absolute', 
  top: '15px', 
  right: '15px', 
  backgroundColor: '#fbbc04', 
  color: '#000', 
  padding: '6px 14px', 
  borderRadius: '12px', 
  fontSize: '11px', 
  fontWeight: 'bold',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};

const versionStyle = { 
  position: 'absolute', 
  bottom: '15px', 
  right: '15px', 
  backgroundColor: 'rgba(0,0,0,0.7)', 
  color: 'white', 
  padding: '4px 12px', 
  borderRadius: '20px', 
  fontSize: '11px', 
  backdropFilter: 'blur(4px)',
  fontWeight: '500'
};

const primaryBtnStyle = { 
  width: '100%', 
  padding: '14px', 
  backgroundColor: '#1a73e8', 
  color: 'white', 
  border: 'none', 
  borderRadius: '15px', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  fontSize: '15px',
  transition: '0.2s',
  boxShadow: '0 4px 10px rgba(26, 115, 232, 0.2)'
};

const getFilterBtnStyle = (isActive, isBlue = false) => ({
  padding: '10px 24px', 
  borderRadius: '25px', 
  border: 'none', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  fontSize: '14px',
  backgroundColor: isActive ? (isBlue ? '#1a73e8' : '#202124') : '#fff',
  color: isActive ? 'white' : '#5f6368',
  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
  transition: 'all 0.3s',
  whiteSpace: 'nowrap'
});
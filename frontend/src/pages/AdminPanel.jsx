import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AdminPanel() {
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form State'leri
  const [newApp, setNewApp] = useState({ name: '', version: '1.0', description: '', categoryId: '', imageUrl: '', apkDownloadUrl: '' });
  const [newCategoryName, setNewCategoryName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    // 🛡️ GÜVENLİK: Admin değilse hemen markete fırlat
    if (!isAdmin) {
      toast.error("Bu sayfaya giriş yetkiniz yok!");
      navigate('/market');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, catsRes] = await Promise.all([
        api.get('/apps'),
        api.get('/apps/categories')
      ]);
      setApps(appsRes.data);
      setCategories(catsRes.data);
      if (catsRes.data.length > 0) {
        setNewApp(prev => ({ ...prev, categoryId: catsRes.data[0].id }));
      }
      setLoading(false);
    } catch (error) {
      toast.error("Veriler yüklenemedi!");
    }
  };

  const handleCreateApp = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...newApp, 
        categories: { connect: [{ id: Number(newApp.categoryId) }] } 
      };
      delete payload.categoryId; // Prisma connect yapısı için temizlik

      await api.post('/apps', payload);
      toast.success("🚀 Uygulama başarıyla yayınlandı!");
      fetchData(); // Listeyi güncelle
      setNewApp({ ...newApp, name: '', description: '', imageUrl: '', apkDownloadUrl: '' });
    } catch (err) {
      toast.error("Uygulama eklenemedi!");
    }
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm("Bu uygulamayı ve tüm paketlerini silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/apps/${id}`);
      toast.success("Uygulama silindi.");
      fetchData();
    } catch (err) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>⚙️ Yetki Kontrol Ediliyor...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>⚙️ Yönetim Paneli</h1>
          <button onClick={() => navigate('/market')} style={{ padding: '10px 20px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⬅ Markete Dön
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* SOL TARAF: EKLEME FORMU */}
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0 }}>➕ Yeni Uygulama Yayınla</h3>
            <form onSubmit={handleCreateApp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input placeholder="Uygulama Adı" value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} style={inputStyle} required />
              
              <select value={newApp.categoryId} onChange={e => setNewApp({...newApp, categoryId: e.target.value})} style={inputStyle}>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <input placeholder="Görsel URL (Base64 veya Link)" value={newApp.imageUrl} onChange={e => setNewApp({...newApp, imageUrl: e.target.value})} style={inputStyle} />
              <textarea placeholder="Açıklama" value={newApp.description} onChange={e => setNewApp({...newApp, description: e.target.value})} style={{...inputStyle, height: '100px'}} />
              
              <button type="submit" style={{ padding: '15px', backgroundColor: '#00a400', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                🚀 Markette Yayınla
              </button>
            </form>
          </div>

          {/* SAĞ TARAF: LİSTE VE YÖNETİM */}
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0 }}>📋 Mevcut Uygulamalar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {apps.map(app => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{app.name}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>v{app.version}</span>
                  </div>
                  <button onClick={() => handleDeleteApp(app.id)} style={{ padding: '8px 15px', backgroundColor: '#ffebee', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Sil 🗑️
                  </button>
                </div>
              ))}
              {apps.length === 0 && <p>Henüz uygulama yok.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' };
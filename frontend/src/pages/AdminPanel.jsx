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
  const [newApp, setNewApp] = useState({ 
    name: '', 
    version: '1.0', 
    description: '', 
    categoryId: '', // Kategori ID'si burada tutulacak
    imageUrl: '', 
    apkDownloadUrl: '' 
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    // 🛡️ ROTA KORUMASI: Sadece Admin girebilir
    if (!isAdmin) {
      toast.error("Bu yetki sadece yöneticilerde var! 🚫");
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
      
      // Eğer kategori varsa, ilk kategoriyi otomatik seçili yap
      if (catsRes.data.length > 0) {
        setNewApp(prev => ({ ...prev, categoryId: catsRes.data[0].id }));
      }
      setLoading(false);
    } catch (error) {
      toast.error("Veriler çekilirken hata oluştu!");
      setLoading(false);
    }
  };

  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!newApp.categoryId) return toast.warning("Lütfen bir kategori seçin!");

    try {
      const payload = { 
        ...newApp, 
        categories: { 
          connect: [{ id: Number(newApp.categoryId) }] 
        } 
      };
      // categoryId alanını temizliyoruz çünkü connect yapısı içinde gönderdik
      const { categoryId, ...finalData } = payload;

      await api.post('/apps', finalData);
      toast.success("🚀 Uygulama başarıyla eklendi!");
      fetchData(); // Listeyi tazele
      setNewApp({ ...newApp, name: '', description: '', imageUrl: '', apkDownloadUrl: '' });
    } catch (err) {
      toast.error("Ekleme sırasında bir hata oluştu.");
    }
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm("Bu uygulamayı silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/apps/${id}`);
      toast.success("Silindi.");
      fetchData();
    } catch (err) {
      toast.error("Silme başarısız.");
    }
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>⚙️ Kontrol Ediliyor...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>⚒️ Uygulama Yönetimi</h1>
          <button onClick={() => navigate('/market')} style={secondaryBtnStyle}>
            ⬅ Markete Dön
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* EKLEME FORMU */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>📥 Yeni Uygulama Ekle</h3>
            <form onSubmit={handleCreateApp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={labelStyle}>Uygulama Adı</label>
              <input value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} style={inputStyle} required />
              
              <label style={labelStyle}>Kategori Seçin</label>
              <select 
                value={newApp.categoryId} 
                onChange={e => setNewApp({...newApp, categoryId: e.target.value})} 
                style={inputStyle}
                required
              >
                {categories.length === 0 && <option>Önce kategori oluşturun</option>}
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <label style={labelStyle}>Görsel Linki (URL)</label>
              <input value={newApp.imageUrl} onChange={e => setNewApp({...newApp, imageUrl: e.target.value})} style={inputStyle} placeholder="https://..." />
              
              <label style={labelStyle}>Açıklama</label>
              <textarea value={newApp.description} onChange={e => setNewApp({...newApp, description: e.target.value})} style={{...inputStyle, height: '80px'}} />
              
              <button type="submit" style={primaryBtnStyle}>
                🚀 Markete Ekle
              </button>
            </form>
          </div>

          {/* MEVCUT LİSTE */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>📋 Yayındaki Uygulamalar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {apps.map(app => (
                <div key={app.id} style={listItemStyle}>
                  <div>
                    <strong style={{ display: 'block' }}>{app.name}</strong>
                    <span style={{ fontSize: '12px', color: '#1a73e8' }}>{app.categories?.[0]?.name || 'Kategorisiz'}</span>
                  </div>
                  <button onClick={() => handleDeleteApp(app.id)} style={deleteBtnStyle}>Sil</button>
                </div>
              ))}
              {apps.length === 0 && <p style={{color: '#888'}}>Henüz uygulama eklenmemiş.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Görsel Nesneler
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '-10px' };
const primaryBtnStyle = { padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const secondaryBtnStyle = { padding: '10px 20px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const deleteBtnStyle = { padding: '6px 12px', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' };
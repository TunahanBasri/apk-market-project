import { useState, useEffect } from 'react';
import api from '../api/axios'; // Merkezi axios istemciniz
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Market() {
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const navigate = useNavigate();

  // Form State'leri
  const [newApp, setNewApp] = useState({ 
    name: '', 
    version: '1.0', 
    description: '', 
    apkDownloadUrl: '', 
    imageUrl: '', 
    categoryId: '' 
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editingId, setEditingId] = useState(null); 

  // Kullanıcı Bilgileri
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchApps();
    fetchCategories();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await api.get('/apps');
      setApps(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Uygulamalar yüklenemedi.");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/apps/categories');
      setCategories(response.data);
      if (response.data.length > 0 && !newApp.categoryId && !editingId) {
        setNewApp(prev => ({ ...prev, categoryId: response.data[0].id }));
      }
    } catch (error) {
      console.error("Kategoriler çekilemedi");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return toast.warning("Kategori adı boş olamaz!");
    try {
      await api.post('/apps/categories', { name: newCategoryName });
      toast.success(`✅ "${newCategoryName}" kategorisi eklendi!`);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      toast.error("Kategori eklenirken hata oluştu.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const scaleFactor = maxWidth / img.width;
        canvas.width = (img.width > maxWidth) ? maxWidth : img.width;
        canvas.height = (img.width > maxWidth) ? img.height * scaleFactor : img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewApp({ ...newApp, imageUrl: canvas.toDataURL('image/jpeg', 0.7) });
        toast.info("📸 Kapak resmi işlendi!");
      };
    };
  };

  const handleApkSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Dosya 5MB'dan büyük olamaz!");
        return;
      }
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewApp({ ...newApp, apkDownloadUrl: event.target.result });
        toast.success(`📂 APK hazır!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/apps/${editingId}`, newApp);
        toast.success('Uygulama güncellendi! ✅');
      } else {
        await api.post('/apps', newApp);
        toast.success('Uygulama yayınlandı! 🚀');
      }
      resetForm();
      fetchApps();
    } catch (error) {
      toast.error('İşlem başarısız!');
    }
  };

  const resetForm = () => {
    setNewApp({ name: '', version: '1.0', description: '', apkDownloadUrl: '', imageUrl: '', categoryId: categories[0]?.id || '' });
    setSelectedFileName('');
    setEditingId(null);
  };

  const startEditing = (app) => {
    setEditingId(app.id);
    setNewApp({
      name: app.name,
      version: app.version,
      description: app.description || '',
      apkDownloadUrl: app.apkDownloadUrl || '',
      imageUrl: app.imageUrl || '',
      categoryId: app.categories?.[0]?.id || (categories[0]?.id || '')
    });
    setSelectedFileName('Mevcut APK korunuyor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm("Bu uygulamayı silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/apps/${id}`);
      toast.success("Uygulama silindi.");
      fetchApps();
    } catch (error) {
      toast.error("Silme işlemi başarısız.");
    }
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

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '24px', cursor: 'pointer' }} onClick={() => navigate('/market')}>🚀 APK Market</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#555' }}>Hoşgeldin, <b>{user.username}</b> {isAdmin && <span style={{ backgroundColor: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', marginLeft: '5px' }}>Admin</span>}</span>
          <button onClick={handleLogout} style={{ padding: '8px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Çıkış</button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* ADMIN PANELİ */}
        {isAdmin && (
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px', border: editingId ? '2px solid #ffc107' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#444' }}>{editingId ? '✏️ Uygulamayı Düzenle' : '➕ Yeni Uygulama Yayınla'}</h3>
              {editingId && <button onClick={resetForm} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Vazgeç</button>}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <input placeholder="Uygulama Adı" value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} required style={inputStyle} />
              <input placeholder="Sürüm (v1.0)" value={newApp.version} onChange={e => setNewApp({ ...newApp, version: e.target.value })} required style={inputStyle} />
              
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'flex-end', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px dashed #ccc' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>📂 Kategori Seç:</label>
                  <select value={newApp.categoryId} onChange={e => setNewApp({ ...newApp, categoryId: e.target.value })} style={{ ...inputStyle, backgroundColor: 'white' }}>
                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                  <input placeholder="Yeni Kategori Adı..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={handleAddCategory} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>+ Ekle</button>
                </div>
              </div>

              <div style={fileUploadContainerStyle}>
                <label style={labelStyle}>🖼️ Kapak Resmi:</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={fileInputStyle} />
              </div>
              <div style={fileUploadContainerStyle}>
                <label style={labelStyle}>📦 APK (Max 5MB):</label>
                <input type="file" accept=".apk" onChange={handleApkSelect} style={fileInputStyle} />
                {selectedFileName && <span style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>✅ {selectedFileName}</span>}
              </div>
              <input placeholder="Açıklama" value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} style={{ ...inputStyle, gridColumn: 'span 2' }} />
              <button type="submit" style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: editingId ? '#ffc107' : '#667eea', color: editingId ? '#333' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? '💾 Değişiklikleri Kaydet' : '🚀 Uygulamayı Yayınla'}
              </button>
            </form>
          </div>
        )}

        {/* KATEGORİ FİLTRELEME */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ color: '#444', margin: 0 }}>📦 Vitrin</h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            <button onClick={() => setSelectedFilter('ALL')} style={getFilterBtnStyle(selectedFilter === 'ALL')}>Tümü</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedFilter(cat.id)} style={getFilterBtnStyle(selectedFilter == cat.id, true)}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* UYGULAMA LİSTESİ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {filteredApps.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>Bu kategoride henüz uygulama yok.</div>
          ) : (
            filteredApps.map((app) => (
              <div key={app.id} style={cardStyle}>
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <img src={app.imageUrl || `https://picsum.photos/seed/${app.id}/400/250`} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {app.categories?.[0] && <span style={badgeStyle}>{app.categories[0].name}</span>}
                  <span style={versionStyle}>v{app.version}</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{app.name}</h3>
                  <p style={{ color: '#777', fontSize: '14px', height: '40px', overflow: 'hidden' }}>{app.description}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => navigate(`/app/${app.id}`)} style={primaryBtnStyle}>İncele</button>
                    {isAdmin && (
                      <>
                        <button onClick={() => startEditing(app)} style={editBtnStyle}>✏️</button>
                        <button onClick={() => handleDeleteApp(app.id)} style={deleteBtnStyle}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Görsel Nesneler & Stiller
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' };
const labelStyle = { fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: 'bold' };
const fileUploadContainerStyle = { display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px dashed #ccc' };
const fileInputStyle = { fontSize: '14px' };
const cardStyle = { backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', position: 'relative' };
const badgeStyle = { position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ffc107', color: '#333', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold' };
const versionStyle = { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' };
const primaryBtnStyle = { flex: 1, padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' };
const editBtnStyle = { padding: '10px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const deleteBtnStyle = { padding: '10px', backgroundColor: '#ffebee', color: '#dc3545', border: 'none', borderRadius: '8px', cursor: 'pointer' };

const getFilterBtnStyle = (isActive, isBlue = false) => ({
  padding: '8px 20px',
  borderRadius: '20px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  backgroundColor: isActive ? (isBlue ? '#007bff' : '#333') : '#e9ecef',
  color: isActive ? 'white' : '#555',
  transition: '0.3s'
});
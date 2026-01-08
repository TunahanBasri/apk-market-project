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

  // Kullanıcı Bilgileri ve Bakiye Takibi
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [balance, setBalance] = useState(user.balance || 0);
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchApps();
    fetchCategories();
    // Sayfa her açıldığında bakiyeyi local'den güncelle
    setBalance(user.balance || 0);
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
      if (file.size > 10 * 1024 * 1024) { 
        toast.warning("Dosya 10MB'dan büyük olamaz!");
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
    
    // Prisma Many-to-Many bağlantısı için payload hazırlığı
    const payload = {
      name: newApp.name,
      version: newApp.version,
      description: newApp.description,
      apkDownloadUrl: newApp.apkDownloadUrl,
      imageUrl: newApp.imageUrl,
      categories: {
        set: [], // Öncekileri temizle (Özellikle update için)
        connect: [{ id: Number(newApp.categoryId) }]
      }
    };

    try {
      if (editingId) {
        await api.patch(`/apps/${editingId}`, payload);
        toast.success('Uygulama güncellendi! ✅');
      } else {
        await api.post('/apps', payload);
        toast.success('Uygulama yayınlandı! 🚀');
      }
      resetForm();
      fetchApps();
    } catch (error) {
      toast.error('İşlem başarısız! Veritabanı bağlantısını kontrol edin.');
    }
  };

  const resetForm = () => {
    setNewApp({ 
        name: '', 
        version: '1.0', 
        description: '', 
        apkDownloadUrl: '', 
        imageUrl: '', 
        categoryId: categories[0]?.id || '' 
    });
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '24px', color: '#1a73e8', fontWeight: 'bold' }}>🚀 Market Yükleniyor...</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, color: '#1a73e8', fontSize: '26px', cursor: 'pointer', fontWeight: '800' }} onClick={() => navigate('/market')}>🚀 APK MARKET</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* 💰 BAKİYE GÖSTERGESİ */}
          <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px 20px', borderRadius: '15px', fontWeight: '800', border: '1px solid #c8e6c9', fontSize: '16px' }}>
            💰 {balance.toFixed(2)} ₺
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
            <span style={{ color: '#555' }}>Hoşgeldin, <b>{user.username}</b></span>
            {isAdmin && <span style={{ backgroundColor: '#1a73e8', color: 'white', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>ADMİN</span>}
            <button onClick={handleLogout} style={{ marginLeft: '10px', padding: '8px 15px', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.3s' }} onMouseOver={e => {e.target.style.backgroundColor='#dc3545'; e.target.style.color='#fff'}}>Çıkış</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1240px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* ADMIN PANELİ */}
        {isAdmin && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '40px', border: editingId ? '2px solid #fbbc04' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#202124', fontSize: '20px' }}>{editingId ? '✏️ Uygulamayı Güncelle' : '➕ Yeni Uygulama Ekle'}</h3>
              {editingId && <button onClick={resetForm} style={{ backgroundColor: '#5f6368', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>Vazgeç</button>}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                  <label style={labelStyle}>Uygulama İsmi</label>
                  <input placeholder="Örn: Instagram" value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                  <label style={labelStyle}>Sürüm Bilgisi</label>
                  <input placeholder="v1.0.4" value={newApp.version} onChange={e => setNewApp({ ...newApp, version: e.target.value })} required style={inputStyle} />
              </div>
              
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', alignItems: 'flex-end', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px dashed #dadce0' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>📂 Kategori Seçimi</label>
                  <select value={newApp.categoryId} onChange={e => setNewApp({ ...newApp, categoryId: e.target.value })} style={{ ...inputStyle, backgroundColor: 'white' }}>
                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                  <div style={{flex:1, display:'flex', flexDirection:'column', gap:'5px'}}>
                    <label style={labelStyle}>Yeni Kategori</label>
                    <input placeholder="Kategori ismi..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={inputStyle} />
                  </div>
                  <button type="button" onClick={handleAddCategory} style={{ height: '45px', alignSelf: 'flex-end', backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '10px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>Ekle</button>
                </div>
              </div>

              <div style={fileUploadContainerStyle}>
                <label style={labelStyle}>🖼️ Kapak Resmi (Önizleme)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={fileInputStyle} />
                {newApp.imageUrl && <span style={{fontSize:'11px', color:'#34a853', marginTop:'5px'}}>Resim başarıyla yüklendi ✅</span>}
              </div>
              <div style={fileUploadContainerStyle}>
                <label style={labelStyle}>📦 APK Dosyası (Max 10MB)</label>
                <input type="file" accept=".apk" onChange={handleApkSelect} style={fileInputStyle} />
                {selectedFileName && <span style={{ fontSize: '12px', color: '#1a73e8', marginTop: '5px', fontWeight:'bold' }}>📄 {selectedFileName}</span>}
              </div>
              <div style={{gridColumn: 'span 2', display:'flex', flexDirection:'column', gap:'5px'}}>
                  <label style={labelStyle}>Uygulama Açıklaması</label>
                  <input placeholder="Uygulama hakkında kısa bilgi..." value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} style={inputStyle} />
              </div>
              <button type="submit" style={{ gridColumn: 'span 2', padding: '16px', backgroundColor: editingId ? '#fbbc04' : '#1a73e8', color: editingId ? '#202124' : 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(26, 115, 232, 0.2)' }}>
                {editingId ? '💾 DEĞİŞİKLİKLERİ KAYDET' : '🚀 UYGULAMAYI YAYINLA'}
              </button>
            </form>
          </div>
        )}

        {/* FİLTRELEME & VİTRİN */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
          <h2 style={{ color: '#202124', margin: 0, fontSize: '26px', fontWeight: '800' }}>📦 Uygulama Vitrini</h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', maxWidth: '100%' }}>
            <button onClick={() => setSelectedFilter('ALL')} style={getFilterBtnStyle(selectedFilter === 'ALL')}>Tümü</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedFilter(cat.id)} style={getFilterBtnStyle(selectedFilter == cat.id, true)}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* LİSTELEME */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {filteredApps.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#5f6368', backgroundColor: '#fff', borderRadius: '25px', fontSize: '18px', border: '2px dashed #dadce0' }}>
                Bu kategoride henüz bir uygulama bulunmuyor.
            </div>
          ) : (
            filteredApps.map((app) => (
              <div key={app.id} style={cardStyle} 
                   onMouseOver={e => {e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)'}} 
                   onMouseOut={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}}>
                <div style={{ height: '190px', overflow: 'hidden', position: 'relative' }}>
                  <img src={app.imageUrl || `https://via.placeholder.com/400x200?text=${app.name}`} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {app.categories?.[0] && <span style={badgeStyle}>{app.categories[0].name}</span>}
                  <span style={versionStyle}>v{app.version}</span>
                </div>
                <div style={{ padding: '25px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#202124', fontSize: '22px', fontWeight: 'bold' }}>{app.name}</h3>
                  <p style={{ color: '#5f6368', fontSize: '15px', height: '45px', overflow: 'hidden', lineHeight: '1.5', marginBottom: '20px' }}>{app.description}</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => navigate(`/app/${app.id}`)} style={primaryBtnStyle}>Detayları Gör</button>
                    {isAdmin && (
                      <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={() => startEditing(app)} style={editBtnStyle} title="Düzenle">✏️</button>
                        <button onClick={() => handleDeleteApp(app.id)} style={deleteBtnStyle} title="Sil">🗑️</button>
                      </div>
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

// Stiller
const inputStyle = { padding: '12px 15px', borderRadius: '10px', border: '1px solid #dadce0', outline: 'none', fontSize: '15px', transition: 'border 0.3s' };
const labelStyle = { fontSize: '12px', color: '#5f6368', marginBottom: '2px', fontWeight: 'bold', marginLeft: '5px' };
const fileUploadContainerStyle = { display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #dadce0' };
const fileInputStyle = { fontSize: '13px', color: '#5f6368' };
const cardStyle = { backgroundColor: 'white', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', position: 'relative', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' };
const badgeStyle = { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fbbc04', color: '#000', padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' };
const versionStyle = { position: 'absolute', bottom: '15px', right: '15px', backgroundColor: 'rgba(32, 33, 36, 0.75)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', backdropFilter: 'blur(5px)' };
const primaryBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const editBtnStyle = { width: '45px', height: '45px', backgroundColor: '#fff', color: '#fbbc04', border: '1px solid #fbbc04', borderRadius: '12px', cursor: 'pointer' };
const deleteBtnStyle = { width: '45px', height: '45px', backgroundColor: '#fff', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '12px', cursor: 'pointer' };

const getFilterBtnStyle = (isActive, isBlue = false) => ({
  padding: '12px 24px',
  borderRadius: '30px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  backgroundColor: isActive ? (isBlue ? '#1a73e8' : '#202124') : '#fff',
  color: isActive ? 'white' : '#5f6368',
  boxShadow: isActive ? '0 6px 15px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
  transition: 'all 0.3s',
  whiteSpace: 'nowrap'
});
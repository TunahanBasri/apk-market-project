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
    apkDownloadUrl: '', 
    imageUrl: '', 
    selectedCategoryIds: [] // Çoklu seçim için dizi
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Yetkisiz Erişim!");
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
      setLoading(false);
    } catch (error) {
      toast.error("Veriler yüklenemedi!");
    }
  };

  // Kategori Seçme/Kaldırma Fonksiyonu
  const handleCategoryToggle = (id) => {
    setNewApp(prev => {
      const isSelected = prev.selectedCategoryIds.includes(id);
      const updated = isSelected 
        ? prev.selectedCategoryIds.filter(catId => catId !== id)
        : [...prev.selectedCategoryIds, id];
      return { ...prev, selectedCategoryIds: updated };
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return toast.warning("Kategori adı boş olamaz!");
    try {
      await api.post('/apps/categories', { name: newCategoryName });
      toast.success(`✅ Kategori eklendi!`);
      setNewCategoryName('');
      fetchData();
    } catch (error) { toast.error("Hata!"); }
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
      if (file.size > 15 * 1024 * 1024) return toast.warning("Max 15MB!");
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
    if (newApp.selectedCategoryIds.length === 0) return toast.warning("En az bir kategori seçin!");

    const payload = {
      name: newApp.name,
      version: newApp.version,
      description: newApp.description,
      apkDownloadUrl: newApp.apkDownloadUrl,
      imageUrl: newApp.imageUrl,
      categories: {
        set: [], // Öncekileri temizle (update için kritik)
        connect: newApp.selectedCategoryIds.map(id => ({ id: Number(id) }))
      }
    };

    try {
      if (editingId) {
        await api.patch(`/apps/${editingId}`, payload);
        toast.success('Güncellendi! ✅');
      } else {
        await api.post('/apps', payload);
        toast.success('Yayınlandı! 🚀');
      }
      resetForm();
      fetchData();
    } catch (error) { toast.error('İşlem başarısız!'); }
  };

  const resetForm = () => {
    setNewApp({ name: '', version: '1.0', description: '', apkDownloadUrl: '', imageUrl: '', selectedCategoryIds: [] });
    setSelectedFileName('');
    setEditingId(null);
  };

  const startEdit = (app) => {
    setEditingId(app.id);
    setNewApp({
      name: app.name,
      version: app.version,
      description: app.description || '',
      apkDownloadUrl: app.apkDownloadUrl || '',
      imageUrl: app.imageUrl || '',
      selectedCategoryIds: app.categories?.map(c => c.id) || []
    });
    setSelectedFileName('Mevcut APK korunuyor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>🚀 Karargah Yükleniyor...</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#1a73e8', margin: 0, fontWeight: '800' }}>⚙️ Uygulama Yönetim Merkezi</h2>
          <button onClick={() => navigate('/market')} style={{ padding: '12px 25px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,115,232,0.3)' }}>Markete Dön</button>
        </header>

        {/* FORM ALANI */}
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '40px', border: editingId ? '2px solid #ffc107' : 'none' }}>
          <h3 style={{ marginBottom: '25px', color: '#333' }}>{editingId ? '✏️ Uygulamayı Düzenle' : '➕ Yeni Uygulama Yayınla'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <label style={labelStyle}>Uygulama İsmi</label>
                <input value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} required style={inputStyle} placeholder="Örn: PUBG Mobile" />
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <label style={labelStyle}>Sürüm Bilgisi</label>
                <input value={newApp.version} onChange={e => setNewApp({ ...newApp, version: e.target.value })} required style={inputStyle} placeholder="v1.0.0" />
            </div>

            {/* ÇOKLU KATEGORİ SEÇİM ALANI */}
            <div style={{ gridColumn: 'span 2', backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '18px', border: '1px dashed #cbd5e0' }}>
              <label style={{...labelStyle, display:'block', marginBottom:'15px'}}>📂 Kategorileri Seç (Birden fazla seçebilirsin)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {categories.map(cat => (
                  <div 
                    key={cat.id} 
                    onClick={() => handleCategoryToggle(cat.id)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      transition: '0.2s all',
                      backgroundColor: newApp.selectedCategoryIds.includes(cat.id) ? '#1a73e8' : '#fff',
                      color: newApp.selectedCategoryIds.includes(cat.id) ? 'white' : '#555',
                      border: '2px solid',
                      borderColor: newApp.selectedCategoryIds.includes(cat.id) ? '#1a73e8' : '#e2e8f0'
                    }}
                  >
                    {cat.name} {newApp.selectedCategoryIds.includes(cat.id) && '✓'}
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <input placeholder="Yeni Kategori Adı..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ ...inputStyle, flex: 1, backgroundColor:'white' }} />
                <button type="button" onClick={handleAddCategory} style={{ backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '10px', padding: '0 25px', fontWeight: 'bold', cursor: 'pointer' }}>Hızlı Ekle</button>
              </div>
            </div>

            <div style={fileBoxStyle}>
              <label style={labelStyle}>🖼️ Kapak Resmi (Önizleme Otomatik)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{fontSize:'13px'}} />
              {newApp.imageUrl && <small style={{color:'#34a853', fontWeight:'bold'}}>✅ Resim işlendi</small>}
            </div>

            <div style={fileBoxStyle}>
              <label style={labelStyle}>📦 APK Dosyası (Max 15MB)</label>
              <input type="file" accept=".apk" onChange={handleApkSelect} style={{fontSize:'13px'}} />
              {selectedFileName && <small style={{color:'#1a73e8', fontWeight:'bold'}}>📄 {selectedFileName}</small>}
            </div>

            <div style={{gridColumn: 'span 2', display:'flex', flexDirection:'column', gap:'8px'}}>
                <label style={labelStyle}>Uygulama Açıklaması</label>
                <textarea value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} style={{ ...inputStyle, height: '100px', resize:'none' }} placeholder="Uygulama hakkında kısa bilgi..." />
            </div>

            <div style={{gridColumn: 'span 2', display:'flex', gap:'15px'}}>
              <button type="submit" style={{ flex: 3, padding: '16px', backgroundColor: editingId ? '#ffc107' : '#1a73e8', color: editingId ? '#333' : 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                {editingId ? '💾 DEĞİŞİKLİKLERİ KAYDET' : '🚀 UYGULAMAYI YAYINLA'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ flex: 1, backgroundColor: '#f1f3f4', color: '#5f6368', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Vazgeç</button>
              )}
            </div>
          </form>
        </div>

        {/* LİSTELEME */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '25px', color: '#333' }}>📋 Yayındaki Uygulamalar ({apps.length})</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {apps.map(app => (
              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 25px', backgroundColor: '#f8f9fa', borderRadius: '15px', border: '1px solid #edf2f7' }}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                  <img src={app.imageUrl || 'https://via.placeholder.com/40'} style={{width:'40px', height:'40px', borderRadius:'10px', objectFit:'cover'}} alt="" />
                  <div>
                    <strong style={{fontSize:'16px'}}>{app.name}</strong>
                    <div style={{fontSize:'12px', color:'#718096'}}>
                      {app.categories?.map(c => c.name).join(', ') || 'Kategorisiz'} • v{app.version}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => startEdit(app)} style={{ background: '#ebf8ff', border: 'none', color: '#3182ce', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold' }}>✏️ Düzenle</button>
                  <button onClick={async () => { if(window.confirm("Bu uygulamayı silmek istediğinize emin misiniz?")){ await api.delete(`/apps/${app.id}`); fetchData(); toast.success("Silindi"); } }} style={{ background: '#fff5f5', border: 'none', color: '#e53e3e', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold' }}>🗑️ Sil</button>
                </div>
              </div>
            ))}
            {apps.length === 0 && <div style={{textAlign:'center', padding:'40px', color:'#a0aec0'}}>Henüz uygulama eklenmemiş.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

// Görsel Nesneler
const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: '0.2s border' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginLeft: '4px' };
const fileBoxStyle = { display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' };
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AdminPanel() {
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form State'leri (Orijinal Dolu Paket)
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
      if (catsRes.data.length > 0 && !newApp.categoryId) {
        setNewApp(prev => ({ ...prev, categoryId: catsRes.data[0].id }));
      }
      setLoading(false);
    } catch (error) {
      toast.error("Veriler yüklenemedi!");
    }
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
      if (file.size > 10 * 1024 * 1024) return toast.warning("Max 10MB!");
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
    const payload = {
      ...newApp,
      categories: { connect: [{ id: Number(newApp.categoryId) }] }
    };
    const { categoryId, ...finalData } = payload;

    try {
      if (editingId) {
        await api.patch(`/apps/${editingId}`, finalData);
        toast.success('Güncellendi! ✅');
      } else {
        await api.post('/apps', finalData);
        toast.success('Yayınlandı! 🚀');
      }
      resetForm();
      fetchData();
    } catch (error) { toast.error('İşlem başarısız!'); }
  };

  const resetForm = () => {
    setNewApp({ name: '', version: '1.0', description: '', apkDownloadUrl: '', imageUrl: '', categoryId: categories[0]?.id || '' });
    setSelectedFileName('');
    setEditingId(null);
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>🚀 Yükleniyor...</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#1a73e8', margin: 0 }}>⚙️ Uygulama Yönetim Merkezi</h2>
          <button onClick={() => navigate('/market')} style={{ padding: '10px 25px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Markete Dön</button>
        </header>

        {/* ANA FORM ALANI */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px' }}>{editingId ? '✏️ Uygulamayı Düzenle' : '➕ Yeni Uygulama Ekle'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                <label style={labelStyle}>Uygulama Adı</label>
                <input value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} required style={inputStyle} />
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                <label style={labelStyle}>Sürüm (v1.0)</label>
                <input value={newApp.version} onChange={e => setNewApp({ ...newApp, version: e.target.value })} required style={inputStyle} />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', alignItems: 'flex-end', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px dashed #ccc' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>📂 Kategori Seç</label>
                <select value={newApp.categoryId} onChange={e => setNewApp({ ...newApp, categoryId: e.target.value })} style={{ ...inputStyle, width: '100%', backgroundColor: 'white' }}>
                  {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                <input placeholder="Yeni Kategori..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={handleAddCategory} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>Ekle</button>
              </div>
            </div>

            <div style={fileBoxStyle}>
              <label style={labelStyle}>🖼️ Kapak Resmi</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div style={fileBoxStyle}>
              <label style={labelStyle}>📦 APK Dosyası</label>
              <input type="file" accept=".apk" onChange={handleApkSelect} />
              {selectedFileName && <small style={{color:'#28a745'}}>✅ {selectedFileName}</small>}
            </div>

            <div style={{gridColumn: 'span 2'}}>
                <label style={labelStyle}>Açıklama</label>
                <textarea value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} style={{ ...inputStyle, width: '100%', height: '80px', resize:'none' }} />
            </div>

            <button type="submit" style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: editingId ? '#ffc107' : '#1a73e8', color: editingId ? '#333' : 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {editingId ? 'Değişiklikleri Kaydet' : 'Uygulamayı Yayınla'}
            </button>
          </form>
        </div>

        {/* LİSTELEME ALANI */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '20px' }}>📋 Mevcut Uygulamalar</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {apps.map(app => (
              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                <span><strong>{app.name}</strong> - v{app.version}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setEditingId(app.id); setNewApp({...app, categoryId: app.categories[0]?.id}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✏️</button>
                  <button onClick={async () => { if(window.confirm("Sil?")){ await api.delete(`/apps/${app.id}`); fetchData(); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '2px' };
const fileBoxStyle = { display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' };
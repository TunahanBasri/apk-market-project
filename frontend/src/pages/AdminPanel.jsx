import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AdminPanel() {
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Uygulama State'leri ---
  const [newApp, setNewApp] = useState({ 
    name: '', 
    version: '1.0', 
    description: '', 
    apkDownloadUrl: '', 
    imageUrl: '', 
    selectedCategoryIds: [] 
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- 💎 Paket (Item) State'leri ---
  const [selectedAppForItems, setSelectedAppForItems] = useState(null); // Hangi uygulamaya paket ekleniyor?
  const [appItems, setAppItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '' });

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

  // --- 🎒 Paket İşlemleri ---
  const fetchAppItems = async (appId) => {
    try {
      const res = await api.get(`/items/app/${appId}`);
      setAppItems(res.data || []);
    } catch (error) {
      toast.error("Paketler getirilemedi.");
    }
  };

  const handleOpenItemPanel = (app) => {
    setSelectedAppForItems(app);
    fetchAppItems(app.id);
    // Paneli görünür kılmak için sayfayı oraya odaklayabiliriz
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/items`, { 
        ...newItem, 
        price: Number(newItem.price), 
        appId: Number(selectedAppForItems.id) 
      });
      toast.success('💎 Yeni paket eklendi!');
      setNewItem({ name: '', price: '', description: '' });
      fetchAppItems(selectedAppForItems.id);
    } catch (error) {
      toast.error('Paket eklenemedi!');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if(!window.confirm("Bu paketi silmek istediğinize emin misiniz?")) return;
    try {
        await api.delete(`/items/${itemId}`);
        toast.success('🗑️ Paket silindi.');
        fetchAppItems(selectedAppForItems.id);
    } catch (error) { toast.error('Silme başarısız!'); }
  };

  // --- 📂 Kategori & Uygulama İşlemleri ---
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
        canvas.width = (img.width > maxWidth) ? maxWidth : img.width;
        canvas.height = (img.width > maxWidth) ? img.height * (maxWidth / img.width) : img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewApp({ ...newApp, imageUrl: canvas.toDataURL('image/jpeg', 0.7) });
        toast.info("📸 Resim işlendi!");
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
        set: editingId ? [] : undefined,
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
          <button onClick={() => navigate('/market')} style={{ padding: '12px 25px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Markete Dön</button>
        </header>

        {/* --- UYGULAMA FORMU --- */}
        <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '25px', color: '#333' }}>{editingId ? '✏️ Uygulamayı Düzenle' : '➕ Yeni Uygulama Yayınla'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            <input value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} required style={inputStyle} placeholder="Uygulama İsmi" />
            <input value={newApp.version} onChange={e => setNewApp({ ...newApp, version: e.target.value })} required style={inputStyle} placeholder="Sürüm (v1.0)" />

            <div style={{ gridColumn: 'span 2', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '18px', border: '1px dashed #cbd5e0' }}>
              <label style={labelStyle}>📂 Kategorileri Seç</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {categories.map(cat => (
                  <div key={cat.id} onClick={() => handleCategoryToggle(cat.id)} style={{ padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', backgroundColor: newApp.selectedCategoryIds.includes(cat.id) ? '#1a73e8' : '#fff', color: newApp.selectedCategoryIds.includes(cat.id) ? 'white' : '#555', border: '1px solid #ddd' }}>
                    {cat.name}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <input placeholder="Yeni Kategori..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={handleAddCategory} style={{ backgroundColor: '#34a853', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold' }}>Ekle</button>
              </div>
            </div>

            <div style={fileBoxStyle}><label style={labelStyle}>🖼️ Kapak Resmi</label><input type="file" accept="image/*" onChange={handleImageUpload} /></div>
            <div style={fileBoxStyle}><label style={labelStyle}>📦 APK Dosyası</label><input type="file" accept=".apk" onChange={handleApkSelect} /></div>
            
            <textarea value={newApp.description} onChange={e => setNewApp({ ...newApp, description: e.target.value })} style={{ ...inputStyle, gridColumn: 'span 2', height: '80px' }} placeholder="Açıklama..." />
            
            <button type="submit" style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
               {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'UYGULAMAYI YAYINLA'}
            </button>
          </form>
        </div>

        {/* --- 💎 PAKET EKLEME PANELİ (Sadece bir uygulama seçilince açılır) --- */}
        {selectedAppForItems && (
          <div style={{ backgroundColor: '#ebf4ff', padding: '30px', borderRadius: '25px', marginBottom: '40px', border: '2px solid #1a73e8' }}>
            <h3 style={{ marginBottom: '20px' }}>💎 {selectedAppForItems.name} - Paket Yönetimi</h3>
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <input placeholder="Paket Adı (Örn: 100 Elmas)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required style={{...inputStyle, flex: 2}} />
              <input type="number" placeholder="Fiyat (₺)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required style={{...inputStyle, flex: 1}} />
              <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '12px', padding: '0 25px', fontWeight: 'bold' }}>Ekle</button>
              <button type="button" onClick={() => setSelectedAppForItems(null)} style={{ backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '12px', padding: '0 20px' }}>Kapat</button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {appItems.map(item => (
                <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <span>{item.name} - <b>{item.price}₺</b></span>
                  <button onClick={() => handleDeleteItem(item.id)} style={{ border: 'none', color: '#e53e3e', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- UYGULAMA LİSTESİ --- */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '25px' }}>📋 Yayındaki Uygulamalar</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {apps.map(app => (
              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f8f9fa', borderRadius: '15px' }}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                  <img src={app.imageUrl || 'https://via.placeholder.com/40'} style={{width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover'}} alt="" />
                  <strong>{app.name}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleOpenItemPanel(app)} style={{ backgroundColor: '#fbbc04', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>💎 Paketler</button>
                  <button onClick={() => startEdit(app)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={async () => { if(window.confirm("Sil?")){ await api.delete(`/apps/${app.id}`); fetchData(); } }} style={{ background: '#fed7d7', border: 'none', color: '#e53e3e', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#4a5568' };
const fileBoxStyle = { display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' };
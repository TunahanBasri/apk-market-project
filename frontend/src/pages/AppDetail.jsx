import { useState, useEffect } from 'react';
import api from '../api/axios'; 
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [app, setApp] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, itemsRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/items/app/${id}`)
      ]);
      setApp(appRes.data);
      setItems(itemsRes.data || []);
    } catch (error) { 
      console.error("Detay hatası:", error);
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false); 
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/items`, { ...newItem, price: Number(newItem.price), appId: Number(id) });
      toast.success('💎 Yeni paket mağazaya eklendi!');
      setNewItem({ name: '', description: '', price: '' });
      fetchData();
    } catch (error) { toast.error('Hata!'); }
  };

  const handleDeleteItem = async (itemId) => {
    if(!window.confirm("Emin misiniz?")) return;
    try {
        await api.delete(`/items/${itemId}`);
        toast.success('🗑️ Paket silindi.');
        fetchData();
    } catch (error) { toast.error('Hata!'); }
  };

  const handleBuy = async (item) => {
    toast.info(`🛒 İşlem başlatılıyor...`, { autoClose: 800 });
    try {
        await api.post(`/items/buy`, {
            userId: Number(user.id),
            itemId: Number(item.id)
        });
        toast.success(`✅ Başarılı! ${item.name} envantere eklendi.`);
    } catch (error) {
        toast.error(error.response?.data?.message || "Hata oluştu!");
    }
  };

  const handleDownloadApk = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.info("⏳ APK Hazırlanıyor...");

    setTimeout(() => {
        const element = document.createElement("a");
        element.href = app.apkDownloadUrl || "#";
        element.download = `${app.name}_v${app.version}.apk`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setIsDownloading(false);
        toast.success("✅ İndirme tamamlandı.");
    }, 2000);
  };

  if (loading) return <div style={{padding:100, textAlign:'center'}}>🚀 Yükleniyor...</div>;
  if (!app) return <div style={{padding:100, textAlign:'center'}}>⚠️ Uygulama bulunamadı.</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '20px' }}>
      {/* ÜST BİLGİ KARTI */}
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', gap: '30px', alignItems: 'center' }}>
        <img src={app.imageUrl || 'https://via.placeholder.com/150'} alt={app.name} style={{ width: '150px', height: '150px', borderRadius: '25px', objectFit: 'cover' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>{app.name}</h1>
          <p style={{ color: '#7f8c8d', fontSize: '18px' }}>Sürüm: {app.version}</p>
          <p style={{ color: '#34495e', lineHeight: '1.6' }}>{app.description}</p>
          <button 
            onClick={handleDownloadApk}
            disabled={isDownloading}
            style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {isDownloading ? 'Hazırlanıyor...' : '📥 Ücretsiz APK İndir'}
          </button>
        </div>
      </div>

      {/* MARKET PAKETLERİ SEKSİYONU */}
      <div style={{ maxWidth: '900px', margin: '30px auto' }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Uygulama İçi Paketler</h2>
        
        {isAdmin && (
          <form onSubmit={handleAddItem} style={{ backgroundColor: '#ecf0f1', padding: '20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input placeholder="Paket Adı" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7', flex: 2 }} required />
            <input type="number" placeholder="Fiyat (₺)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7', flex: 1 }} required />
            <button type="submit" style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }}>Ekle</button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {items.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>💎</div>
              <h3 style={{ margin: '0 0 10px 0' }}>{item.name}</h3>
              <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '20px' }}>{item.price} ₺</p>
              <button onClick={() => handleBuy(item)} style={{ backgroundColor: '#e67e22', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', width: '100%', marginTop: '10px' }}>Satın Al</button>
              
              {isAdmin && (
                <button onClick={() => handleDeleteItem(item.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
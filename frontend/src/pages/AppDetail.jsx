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

  // Kullanıcı ve Yetki Kontrolü
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
      // ID'yi güvenli bir şekilde gönderiyoruz
      const [appRes, itemsRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/items/app/${id}`)
      ]);
      setApp(appRes.data);
      setItems(itemsRes.data || []);
    } catch (error) { 
      console.error("Detay hatası:", error);
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false); 
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/items`, { 
        ...newItem, 
        price: Number(newItem.price), 
        appId: Number(id) 
      });
      toast.success('💎 Yeni paket mağazaya eklendi!');
      setNewItem({ name: '', description: '', price: '' });
      fetchData();
    } catch (error) { toast.error('Ekleme başarısız!'); }
  };

  const handleDeleteItem = async (itemId) => {
    if(!window.confirm("Bu paketi silmek istediğinize emin misiniz?")) return;
    try {
        await api.delete(`/items/${itemId}`);
        toast.success('🗑️ Paket silindi.');
        fetchData();
    } catch (error) { toast.error('Silme başarısız!'); }
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
        toast.error(error.response?.data?.message || "Bakiye yetersiz veya bir hata oluştu!");
    }
  };

  const handleDownloadApk = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.info("⏳ APK Hazırlanıyor...");

    setTimeout(() => {
        const element = document.createElement("a");
        element.href = app.apkDownloadUrl || "#";
        element.download = `${app.name.replace(/\s+/g, '_')}_v${app.version}.apk`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setIsDownloading(false);
        toast.success("✅ İndirme tamamlandı.");
    }, 2000);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#3498db' }}>🚀 Yükleniyor...</h2>
        <p>Lütfen bekleyin, veriler çekiliyor.</p>
      </div>
    </div>
  );

  if (!app) return (
    <div style={{ padding: 100, textAlign: 'center', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <h2 style={{ color: '#e74c3c' }}>⚠️ Uygulama bulunamadı.</h2>
      <button onClick={() => navigate('/market')} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Markete Dön</button>
    </div>
  );

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh', 
      padding: '40px 20px',
      color: '#1c1e21'
    }}>
      {/* ÜST BİLGİ KARTI */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto', 
        backgroundColor: '#ffffff', 
        borderRadius: '20px', 
        padding: '40px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
        display: 'flex', 
        gap: '40px', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flexShrink: 0 }}>
          <img 
            src={app.imageUrl || 'https://via.placeholder.com/180?text=Uygulama'} 
            alt={app.name} 
            style={{ width: '180px', height: '180px', borderRadius: '40px', objectFit: 'cover', border: '5px solid #f0f2f5' }} 
          />
        </div>
        
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '36px', color: '#1a1a1a' }}>{app.name}</h1>
            <span style={{ backgroundColor: '#e7f3ff', color: '#1877f2', padding: '4px 12px', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold' }}>
              v{app.version}
            </span>
          </div>
          <p style={{ color: '#65676b', fontSize: '18px', marginBottom: '20px', lineHeight: '1.6' }}>{app.description}</p>
          <button 
            onClick={handleDownloadApk}
            disabled={isDownloading}
            style={{ 
              backgroundColor: '#00a400', 
              color: 'white', 
              border: 'none', 
              padding: '15px 35px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '18px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 10px rgba(0, 164, 0, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            {isDownloading ? '⌛ Hazırlanıyor...' : '📥 Ücretsiz APK İndir'}
          </button>
        </div>
      </div>

      {/* MARKET PAKETLERİ SEKSİYONU */}
      <div style={{ maxWidth: '1000px', margin: '50px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
            <h2 style={{ color: '#1c1e21', margin: 0 }}>💎 Uygulama İçi Paketler</h2>
            {isAdmin && <span style={{ color: '#1877f2', fontWeight: 'bold' }}>Yönetici Paneli</span>}
        </div>
        
        {isAdmin && (
          <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '15px', marginBottom: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>➕ Yeni Paket Ekle</h4>
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input 
                placeholder="Paket Adı (Örn: Altın Üyelik)" 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', flex: 3, minWidth: '200px' }} 
                required 
              />
              <input 
                type="number" 
                placeholder="Fiyat (₺)" 
                value={newItem.price} 
                onChange={e => setNewItem({...newItem, price: e.target.value})} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1, minWidth: '100px' }} 
                required 
              />
              <button 
                type="submit" 
                style={{ backgroundColor: '#1877f2', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Ekle
              </button>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {items.length === 0 ? (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#65676b', padding: '40px' }}>Bu uygulama için henüz satın alınabilir bir paket bulunmuyor.</p>
          ) : (
            items.map(item => (
              <div key={item.id} style={{ 
                backgroundColor: 'white', 
                padding: '30px', 
                borderRadius: '18px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)', 
                textAlign: 'center', 
                position: 'relative',
                border: '1px solid #eee',
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '45px', marginBottom: '15px' }}>💎</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>{item.name}</h3>
                <p style={{ color: '#00a400', fontWeight: '800', fontSize: '28px', margin: '10px 0' }}>{item.price} ₺</p>
                <button 
                  onClick={() => handleBuy(item)} 
                  style={{ 
                    backgroundColor: '#1c1e21', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 20px', 
                    borderRadius: '10px', 
                    cursor: 'pointer', 
                    width: '100%', 
                    marginTop: '15px',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Şimdi Satın Al
                </button>
                
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteItem(item.id)} 
                    style={{ position: 'absolute', top: '15px', right: '15px', background: '#ffebee', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px', padding: '5px', borderRadius: '50%' }}
                    title="Paketi Sil"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
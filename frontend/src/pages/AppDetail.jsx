import { useState, useEffect } from 'react';
import axios from 'axios';
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

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  // --- RAILWAY BACKEND LINKI ---
  const API_URL = "https://apk-market-project-production.up.railway.app";

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // LINK GÜNCELLENDİ
      const appRes = await axios.get(`${API_URL}/apps/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const itemsRes = await axios.get(`${API_URL}/items/app/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setApp(appRes.data);
      setItems(itemsRes.data);
      setLoading(false);
    } catch (error) { 
      toast.error("Veriler yüklenirken hata oluştu.");
      setLoading(false); 
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // LINK GÜNCELLENDİ
      await axios.post(`${API_URL}/items`, { ...newItem, appId: id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('💎 Yeni paket mağazaya eklendi!');
      setNewItem({ name: '', description: '', price: '' });
      fetchData();
    } catch (error) { toast.error('Hata!'); }
  };

  const handleDeleteItem = async (itemId) => {
    try {
        // LINK GÜNCELLENDİ
        await axios.delete(`${API_URL}/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('🗑️ Paket başarıyla silindi.');
        fetchData();
    } catch (error) { toast.error('Silme işlemi başarısız!'); }
  };

  const handleBuy = async (item) => {
    toast.info(`🛒 "${item.name}" işlemi başlatılıyor...`, { autoClose: 1000 });
    
    try {
        // LINK GÜNCELLENDİ
        await axios.post(`${API_URL}/items/buy`, {
            userId: user.id,
            itemId: item.id
        }, { headers: { Authorization: `Bearer ${token}` } });

        setTimeout(() => {
            toast.success(`✅ Başarılı! "${item.name}" envanterinize eklendi (-${item.price} ₺)`);
        }, 1200);

    } catch (error) {
        console.error(error);
        toast.error("Satın alma sırasında hata oluştu!");
    }
  };

  const handleDownloadApk = () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.info("⏳ Installer (Ön Yükleyici) hazırlanıyor...");

    setTimeout(() => {
        const element = document.createElement("a");
        if (app.apkDownloadUrl && app.apkDownloadUrl.startsWith('data:')) {
            element.href = app.apkDownloadUrl;
        } else {
            const file = new Blob(["Installer demo..."], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
        }

        const safeName = app.name.replace(/\s+/g, '_');
        element.download = `${safeName}_Installer_v${app.version}.apk`;
        
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        toast.success("✅ Installer indirildi! Kurulumu başlatabilirsiniz.");
        setIsDownloading(false);
    }, 2000);
  };

  if (loading) return <div style={{padding:50, textAlign:'center'}}>Yükleniyor...</div>;
  if (!app) return <div style={{padding:50, textAlign:'center'}}>Uygulama bulunamadı.</div>;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* HEADER BANNER */}
      <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
        <img 
          src={app.imageUrl ? app.imageUrl : `https://picsum.photos/seed/${app.id}/1200/400`} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} 
          onError={(e) => { e.target.src = `https://picsum.photos/seed/${app.id}/1200/400`; }} 
        />
        <button onClick={() => navigate('/market')} style={{ position: 'absolute', top: '20px', left: '20px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>← Geri Dön</button>
        
        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', padding: '30px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '42px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{app.name}</h1>
          <p style={{ color: '#ddd', fontSize: '18px', margin: '5px 0' }}>Sürüm: {app.version}</p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '-30px auto 0', padding: '0 20px', position: 'relative', zIndex: 2 }}>
        
        {/* AÇIKLAMA KUTUSU & İNDİRME BUTONU */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <p style={{ color: '#555', lineHeight: '1.6', margin: 0, flex: 1 }}>{app.description}</p>
          
          <button 
            onClick={handleDownloadApk} 
            disabled={isDownloading} 
            style={{ 
                backgroundColor: isDownloading ? '#6c757d' : '#28a745', 
                color: 'white', border: 'none', padding: '15px 40px', borderRadius: '50px', fontSize: '16px', fontWeight: 'bold', 
                cursor: isDownloading ? 'wait' : 'pointer', boxShadow: '0 5px 15px rgba(40,167,69,0.3)', transition: '0.3s', minWidth: '180px' 
            }}>
             {isDownloading ? '⏳ İndiriliyor...' : '📥 İndir (Installer)'}
          </button>
        </div>

        {/* SATIN ALMA ALANI */}
        <h3 style={{ marginTop: '40px', color: '#444' }}>🛒 Mağaza Paketleri</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {items.map(item => (
            <div key={item.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', position: 'relative' }}>
              
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>💎</div>
              <h4 style={{ margin: '10px 0', color: '#333' }}>{item.name}</h4>
              <p style={{ color: '#28a745', fontWeight: 'bold', fontSize: '24px', margin: '5px 0' }}>{item.price} ₺</p>
              
              <div style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                <button onClick={() => handleBuy(item)} style={{ flex: 1, padding: '10px', backgroundColor: '#ffc107', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>
                    Satın Al
                </button>

                {isAdmin && (
                    <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        🗑️
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ADMIN PAKET EKLEME */}
        {isAdmin && (
          <div style={{ marginTop: '50px', backgroundColor: '#e9ecef', padding: '25px', borderRadius: '15px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>⚙️ Paket Yönetimi (Admin)</h4>
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '10px' }}>
              <input placeholder="Paket Adı" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', flex: 1 }} />
              <input placeholder="Fiyat" type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '100px' }} />
              <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Ekle</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
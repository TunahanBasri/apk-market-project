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
  const [userBalance, setUserBalance] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    
    setUserBalance(user.balance || 0);
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
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false); 
    }
  };

  const handleBuy = async (item) => {
    if (userBalance < item.price) {
      toast.error(`❌ Bakiyeniz yetersiz! Gereken: ${item.price} ₺`);
      return;
    }

    toast.info(`🛒 İşlem başlatılıyor...`, { autoClose: 800 });
    try {
        // 1. Ödeme İşlemi (Bakiye Düşürme)
        await api.post(`/items/buy`, {
            userId: Number(user.id),
            itemId: Number(item.id)
        });

        // 🔥 2. ENVANTER KAYDI (Delivery Tablosuna Ekleme)
        // Bu istek yapılmazsa Envanter sayfası boş görünür.
        await api.post('/deliveries', {
          itemPackageId: Number(item.id),
          userId: Number(user.id),
          gameUserId: user.username // Oyun içi ID olarak username gönderiyoruz
        });

        // 3. Local State ve Storage Güncelleme
        const newBalance = userBalance - item.price;
        setUserBalance(newBalance);
        
        const updatedUser = { ...user, balance: newBalance };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        toast.success(`✅ Başarılı! ${item.name} alındı ve envantere eklendi.`);
    } catch (error) {
        console.error("Satın alma hatası:", error);
        toast.error(error.response?.data?.message || "Satın alma başarısız!");
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
        <h2 style={{ color: '#3498db' }}>🚀 Veriler Çekiliyor...</h2>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '0 0 40px 0' }}>
      
      {/* NAVBAR */}
      <nav style={{ backgroundColor: '#fff', padding: '15px 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, color: '#1877f2', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/market')}>🚀 APK Market</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/inventory')} 
            style={{ backgroundColor: '#fff', color: '#1877f2', border: '1px solid #1877f2', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            🎒 Envanterim
          </button>
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')} 
              style={{ backgroundColor: '#fbbc04', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              ⚙️ Yönetim
            </button>
          )}
          <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px 20px', borderRadius: '15px', fontWeight: 'bold', border: '1px solid #c8e6c9', fontSize: '18px' }}>
            💰 Cüzdan: {userBalance.toFixed(2)} ₺
          </div>
          <button onClick={() => navigate('/market')} style={{ border: 'none', background: '#f0f2f5', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Geri Dön</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* APP BILGI KARTI */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '25px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
          <img 
            src={app?.imageUrl || 'https://via.placeholder.com/180?text=Uygulama'} 
            alt={app?.name} 
            style={{ width: '180px', height: '180px', borderRadius: '40px', objectFit: 'cover', border: '5px solid #f0f2f5', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} 
          />
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '36px', color: '#1a1a1a' }}>{app?.name}</h1>
              <span style={{ backgroundColor: '#e7f3ff', color: '#1877f2', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>v{app?.version}</span>
            </div>
            <p style={{ color: '#65676b', fontSize: '19px', marginBottom: '25px', lineHeight: '1.6' }}>{app?.description}</p>
            <button 
              onClick={handleDownloadApk}
              disabled={isDownloading}
              style={{ backgroundColor: '#00a400', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 5px 15px rgba(0,164,0,0.3)' }}
            >
              {isDownloading ? '⌛ Hazırlanıyor...' : '📥 Ücretsiz APK İndir'}
            </button>
          </div>
        </div>

        {/* PAKETLER */}
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ color: '#1c1e21', margin: '0 0 25px 0', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>💎 Uygulama İçi Paketler</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {items.map(item => (
              <div key={item.id} style={{ backgroundColor: 'white', padding: '35px', borderRadius: '22px', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', textAlign: 'center', border: '1px solid #f0f0f0', transition: 'transform 0.3s' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px' }}>💎</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>{item.name}</h3>
                <p style={{ color: '#00a400', fontWeight: '800', fontSize: '30px', margin: '15px 0' }}>{item.price} ₺</p>
                <button 
                  onClick={() => handleBuy(item)} 
                  style={{ backgroundColor: '#1c1e21', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold', fontSize: '16px' }}
                >
                  Şimdi Satın Al
                </button>
              </div>
            ))}
            {items.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#888' }}>Bu uygulama için henüz paket eklenmemiş.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Inventory() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // LocalStorage'dan kullanıcıyı çek
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      // 1. Önce genel deliveries listesini çekmeyi dene
      const response = await api.get('/deliveries');
      
      // 2. Sadece bu kullanıcıya ait olan siparişleri filtrele
      // (Backend'de findByUser metodu yoksa bu hayat kurtarır)
      const myOrders = response.data.filter(d => d.userId === user.id);
      
      setDeliveries(myOrders);
    } catch (error) {
      console.error("Envanter Hatası:", error);
      toast.error("Siparişler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontSize: '20px' }}>🎒 Çanta Kontrol Ediliyor...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#1a73e8' }}>🎒 Envanterim</h1>
          <button onClick={() => navigate('/market')} style={{ padding: '10px 25px', borderRadius: '12px', border: 'none', backgroundColor: '#1877f2', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(24, 119, 242, 0.3)' }}>Markete Dön</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {deliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div style={{fontSize: '50px', marginBottom: '15px'}}>🛒</div>
              <p style={{ color: '#666', fontSize: '18px', fontWeight: '500' }}>Henüz bir paket satın almamışsın.</p>
              <button onClick={() => navigate('/market')} style={{marginTop: '15px', background: 'none', border: '1px solid #1877f2', color: '#1877f2', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer'}}>Alışverişe Başla</button>
            </div>
          ) : (
            deliveries.map(d => (
              <div key={d.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{fontSize: '30px'}}>💎</div>
                  <div>
                    <strong style={{ fontSize: '18px', display: 'block', color: '#1c1e21' }}>{d.itemPackage?.name || 'Paket'}</strong>
                    <span style={{ fontSize: '14px', color: '#1877f2', fontWeight: '600' }}>🎮 {d.itemPackage?.app?.name || 'Uygulama'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>{new Date(d.createdAt).toLocaleDateString('tr-TR')}</div>
                  <div style={{ color: '#2ecc71', fontWeight: 'bold', backgroundColor: '#e8fdf0', padding: '4px 12px', borderRadius: '10px', fontSize: '13px' }}>Teslim Edildi ✅</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
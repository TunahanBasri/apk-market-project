import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Inventory() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      // Backend'de /deliveries/my-orders gibi bir endpoint olduğunu varsayıyoruz
      // Eğer yoksa User tablosundan include ile de çekebiliriz
      const response = await api.get(`/deliveries/my-orders`);
      setDeliveries(response.data);
    } catch (error) {
      toast.error("Siparişler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0 }}>🎒 Envanterim</h1>
          <button onClick={() => navigate('/market')} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#1877f2', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Markete Dön</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {deliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '20px' }}>
              <p style={{ color: '#666' }}>Henüz bir şey satın almamışsın. 🛒</p>
            </div>
          ) : (
            deliveries.map(d => (
              <div key={d.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '18px', display: 'block' }}>{d.itemPackage.name}</strong>
                  <span style={{ fontSize: '14px', color: '#1877f2' }}>Uygulama: {d.itemPackage.app.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>{new Date(d.createdAt).toLocaleDateString()}</div>
                  <div style={{ color: '#2ecc71', fontWeight: 'bold' }}>Teslim Edildi ✅</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
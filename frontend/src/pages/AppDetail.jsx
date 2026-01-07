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
    if (!token) { 
      navigate('/login'); 
      return; 
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 🔥 DÜZELTME: ID'yi sayıya çeviriyoruz (Eğer backend Int bekliyorsa şart)
      const appId = id; 

      // İstekleri paralel atarak hızı artıralım
      const [appRes, itemsRes] = await Promise.all([
        api.get(`/apps/${appId}`),
        api.get(`/items/app/${appId}`)
      ]);
      
      if (appRes.data) {
        setApp(appRes.data);
        setItems(itemsRes.data || []);
      } else {
        toast.error("Uygulama verisi boş geldi.");
      }

    } catch (error) { 
      console.error("Detay hatası:", error);
      // Eğer backend 404 dönerse direkt markete atalım
      if (error.response?.status === 404) {
        toast.error("Uygulama veritabanında bulunamadı.");
        navigate('/market');
      } else {
        toast.error("Sunucu bağlantı hatası!");
      }
    } finally {
      setLoading(false); 
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // Backend Int bekliyorsa price'ı sayıya çevirelim
      await api.post(`/items`, { 
        ...newItem, 
        price: Number(newItem.price), 
        appId: Number(id) 
      });
      toast.success('💎 Yeni paket mağazaya eklendi!');
      setNewItem({ name: '', description: '', price: '' });
      fetchData();
    } catch (error) { 
      toast.error('Paket eklenirken hata oluştu!'); 
    }
  };

  const handleDeleteItem = async (itemId) => {
    if(!window.confirm("Bu paketi silmek istediğine emin misin?")) return;
    try {
        await api.delete(`/items/${itemId}`);
        toast.success('🗑️ Paket silindi.');
        fetchData();
    } catch (error) { toast.error('Silme işlemi başarısız!'); }
  };

  const handleBuy = async (item) => {
    try {
        await api.post(`/items/buy`, {
            userId: Number(user.id),
            itemId: Number(item.id)
        });
        toast.success(`✅ Başarılı! ${item.name} envanterinize eklendi.`);
    } catch (error) {
        const msg = error.response?.data?.message || "Satın alma başarısız!";
        toast.error(msg);
    }
  };

  const handleDownloadApk = () => {
    if (!app?.apkDownloadUrl) {
      toast.warning("Bu uygulama için APK henüz yüklenmemiş.");
      return;
    }
    setIsDownloading(true);
    toast.info("⏳ İndirme başlıyor...");

    setTimeout(() => {
        const element = document.createElement("a");
        element.href = app.apkDownloadUrl;
        const safeName = app.name.replace(/\s+/g, '_');
        element.download = `${safeName}_v${app.version}.apk`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setIsDownloading(false);
    }, 1500);
  };

  if (loading) return <div style={{padding:100, textAlign:'center', fontSize: 20}}>🚀 Uygulama Detayları Yükleniyor...</div>;
  
  if (!app) return (
    <div style={{padding:100, textAlign:'center'}}>
      <h2>⚠️ Uygulama bulunamadı.</h2>
      <button onClick={() => navigate('/market')}>Markete Dön</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '20px' }}>
        {/* Buraya senin mevcut CSS/HTML yapını ekleyebilirsin */}
        <h1>{app.name} - Detaylar</h1>
        <p>{app.description}</p>
        <button onClick={handleDownloadApk} disabled={isDownloading}>
          {isDownloading ? 'İndiriliyor...' : 'APK İndir'}
        </button>
        {/* ... Market Paketleri Listesi ... */}
    </div>
  );
}
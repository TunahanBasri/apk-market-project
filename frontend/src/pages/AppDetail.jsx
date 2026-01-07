import { useState, useEffect } from 'react';
// 1. Standart axios yerine kendi oluşturduğun api'yi çağırıyoruz
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

  // Token ve User bilgisini sadece UI kontrolleri (Admin mi değil mi) için alıyoruz
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles && user.roles.includes('ADMIN');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // 2. URL'leri ve Header'ları temizledik. api.js otomatik hallediyor.
      const appRes = await api.get(`/apps/${id}`);
      const itemsRes = await api.get(`/items/app/${id}`);
      
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
      // 3. Post isteği artık çok daha sade
      await api.post(`/items`, { ...newItem, appId: id });
      toast.success('💎 Yeni paket mağazaya eklendi!');
      setNewItem({ name: '', description: '', price: '' });
      fetchData();
    } catch (error) { toast.error('Hata!'); }
  };

  const handleDeleteItem = async (itemId) => {
    try {
        await api.delete(`/items/${itemId}`);
        toast.success('🗑️ Paket başarıyla silindi.');
        fetchData();
    } catch (error) { toast.error('Silme işlemi başarısız!'); }
  };

  const handleBuy = async (item) => {
    toast.info(`🛒 "${item.name}" işlemi başlatılıyor...`, { autoClose: 1000 });
    
    try {
        await api.post(`/items/buy`, {
            userId: user.id,
            itemId: item.id
        });

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

  // ... (Geri kalan return/UI kısmı aynı kalıyor)
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f6f9', minHeight: '100vh', paddingBottom: '40px' }}>
        {/* UI kodların burada devam ediyor... */}
        {/* Değişiklik yapmana gerek yok, aynen yapıştırabilirsin */}
    </div>
  );
}
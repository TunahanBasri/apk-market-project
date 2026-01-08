import { useState } from 'react';
import api from '../api/axios'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Alert yerine daha şık bildirimler için

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // --- GİRİŞ YAPMA İŞLEMİ ---
        const response = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        
        // Token'ı sakla
        localStorage.setItem('token', response.data.access_token);
        
        // 💰 KULLANICI VERİSİNİ VE BAKİYESİNİ SAKLA
        // Backend'den gelen user objesinin içinde artık 'balance' da var.
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast.success(`Tekrar hoşgeldin, ${userData.username}! 🚀`);
        navigate('/market');

      } else {
        // --- KAYIT OLMA İŞLEMİ ---
        // Prisma'da @default(100) dediğimiz için kayıt anında 100 TL otomatik tanımlanacak
        await api.post('/auth/register', formData);
        toast.success('Kayıt Başarılı! 100 TL hoşgeldin bonusun tanımlandı. 💰');
        setIsLogin(true); // Giriş ekranına yönlendir
      }
    } catch (error) {
      console.error("Hata:", error);
      const errorMsg = error.response?.data?.message || 'İşlem Başarısız! Bilgileri kontrol et.';
      toast.error(errorMsg);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '20px', 
        boxShadow: '0 15px 35px rgba(0,0,0,0.3)', 
        width: '380px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🚀</div>
        <h2 style={{ color: '#333', marginBottom: '10px', fontWeight: '800' }}>APK MARKET</h2>
        <h4 style={{ color: '#666', marginBottom: '30px', fontWeight: 'normal' }}>
          {isLogin ? 'Hesabına giriş yap' : 'Yeni hesap oluştur ve 100 TL kazan'}
        </h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Kullanıcı Adı" 
            value={formData.username} 
            onChange={e => setFormData({...formData, username: e.target.value})} 
            required 
            style={inputStyle} 
          />

          {!isLogin && (
            <input 
              type="email" 
              placeholder="E-posta Adresi" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              style={inputStyle} 
            />
          )}

          <input 
            type="password" 
            placeholder="Şifre" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
            style={inputStyle} 
          />

          <button type="submit" style={buttonStyle}>
            {isLogin ? 'Giriş Yap' : 'Hemen Kayıt Ol'}
          </button>
        </form>

        <p style={{ marginTop: '25px', fontSize: '14px', color: '#666' }}>
          {isLogin ? 'Henüz hesabın yok mu?' : 'Zaten bir hesabın var mı?'} <br/>
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: '#764ba2', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Yeni Hesap Oluştur' : 'Giriş Ekranına Dön'}
          </span>
        </p>
      </div>
    </div>
  );
}

// Görsel Stiller
const inputStyle = {
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid #ddd',
  fontSize: '15px',
  outline: 'none',
  backgroundColor: '#f9f9f9',
  transition: '0.3s focus',
};

const buttonStyle = {
  padding: '14px',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(to right, #667eea, #764ba2)',
  color: 'white',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px',
  boxShadow: '0 5px 15px rgba(118, 75, 162, 0.4)',
  transition: '0.3s transform'
};
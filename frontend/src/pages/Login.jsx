import { useState } from 'react';
import api from '../api/axios'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.access_token);
        
        // 💰 Kullanıcı verisini bakiye ile birlikte al
        const userData = response.data.user;
        // Eğer bakiye gelmiyorsa varsayılan 100 set et (İlk kayıt koruması)
        if (userData && userData.balance === undefined) userData.balance = 100;
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        toast.success(`Tekrar hoşgeldin, ${userData.username}! 🚀`);
        navigate('/market');

      } else {
        await api.post('/auth/register', formData);
        toast.success('Kayıt Başarılı! 100 TL hoşgeldin bonusun tanımlandı. 💰');
        setIsLogin(true);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'İşlem Başarısız!';
      toast.error(errorMsg);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', width: '380px', textAlign: 'center' }}>
        <h2 style={{ color: '#333', fontWeight: '800' }}>APK MARKET</h2>
        <h4 style={{ color: '#666', marginBottom: '30px' }}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol ve 100 TL Kazan'}</h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" placeholder="Kullanıcı Adı" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required style={inputStyle} />
          {!isLogin && <input type="email" placeholder="E-posta" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={inputStyle} />}
          <input type="password" placeholder="Şifre" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={inputStyle} />
          <button type="submit" style={buttonStyle}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</button>
        </form>
        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          {isLogin ? 'Hesabın yok mu?' : 'Üye misin?'} <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#764ba2', fontWeight: 'bold', cursor: 'pointer' }}>{isLogin ? 'Kayıt Ol' : 'Giriş Yap'}</span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = { padding: '14px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' };
const buttonStyle = { padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #667eea, #764ba2)', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
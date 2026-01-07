import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  // --- RAILWAY BACKEND LINKI ---
  const API_URL = "https://apk-market-project-production.up.railway.app";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // LINK GÜNCELLENDİ
        const response = await axios.post(`${API_URL}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/market');
      } else {
        // LINK GÜNCELLENDİ
        await axios.post(`${API_URL}/auth/register`, formData);
        alert('Kayıt Başarılı! Şimdi giriş yapabilirsin.');
        setIsLogin(true);
      }
    } catch (error) {
      alert('İşlem Başarısız! Bilgileri kontrol et.');
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
        borderRadius: '15px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
        width: '350px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>🚀 APK Market</h2>
        <h4 style={{ color: '#666', marginBottom: '30px', fontWeight: 'normal' }}>{isLogin ? 'Hoşgeldin!' : 'Hemen Aramıza Katıl'}</h4>
        
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
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          {isLogin ? 'Hesabın yok mu?' : 'Zaten üye misin?'} <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#764ba2', fontWeight: 'bold', cursor: 'pointer' }}>
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  outline: 'none',
  transition: '0.3s'
};

const buttonStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  background: 'linear-gradient(to right, #667eea, #764ba2)',
  color: 'white',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px'
};
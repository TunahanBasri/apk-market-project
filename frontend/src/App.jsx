import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Market from './pages/Market';
import AppDetail from './pages/AppDetail';

// 1. CSS DOSYASINI UNUTMA! (Bu olmazsa bildirim çirkin görünür)
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

function App() {
  return (
    <BrowserRouter>
      {/* 2. AYARLARI BURADAN DEĞİŞTİRİYORUZ */}
      <ToastContainer 
        position="bottom-right"  // Artık sağ alttan çıkacak
        autoClose={3000}         // 3 saniye sonra kaybolacak
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"          // "light", "dark" veya "colored" yapabilirsin
      />
      
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/market" element={<Market />} />
        <Route path="/app/:id" element={<AppDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
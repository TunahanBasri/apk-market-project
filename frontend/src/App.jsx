import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Market from './pages/Market';
import AppDetail from './pages/AppDetail';
import AdminPanel from './pages/AdminPanel';
import Inventory from './pages/Inventory'; // 🎒 Envanter sayfasını ekledik

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

function App() {
  return (
    <BrowserRouter>
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000} 
        theme="colored"
      />
      
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/market" element={<Market />} />
        <Route path="/app/:id" element={<AppDetail />} />
        <Route path="/inventory" element={<Inventory />} /> {/* 👈 Yeni Rota */}
        
        {/* ⚙️ YÖNETİM PANELİ ROTASI */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Tanımsız yollar için markete fırlat */}
        <Route path="*" element={<Navigate to="/market" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SubmitterInterface from './SubmitterInterface';
import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';

function AdminRoute() {
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  return isAuthenticated ? <Dashboard /> : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SubmitterInterface />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

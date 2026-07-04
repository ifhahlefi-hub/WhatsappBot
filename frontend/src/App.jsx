import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ChatHistory from './pages/ChatHistory';
import Expenses from './pages/Expenses';
import SystemActivity from './pages/SystemActivity';
import UserDetail from './pages/UserDetail';
import Roles from './pages/Roles';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Operator', 'Moderator']}><Users /></ProtectedRoute>} />
          <Route path="users/:id" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Operator', 'Moderator']}><UserDetail /></ProtectedRoute>} />
          <Route path="chats" element={<ProtectedRoute allowedRoles={['Super Admin']}><ChatHistory /></ProtectedRoute>} />
          <Route path="expenses" element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Operator']}><Expenses /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute allowedRoles={['Super Admin']}><Roles /></ProtectedRoute>} />
          <Route path="system" element={<ProtectedRoute allowedRoles={['Super Admin']}><SystemActivity /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

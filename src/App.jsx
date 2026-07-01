import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-on-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8 max-w-7xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'var(--md-sys-color-inverse-surface)',
                color: 'var(--md-sys-color-inverse-on-surface)',
                borderRadius: '8px',
              }
            }} 
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home            from './pages/Home'
import Admin           from './pages/Admin'
import Login           from './pages/Login'
import Register        from './pages/Register'
import AdminLogin      from './pages/AdminLogin'
import MemberDashboard from './pages/MemberDashboard'
import ForgotPassword  from './pages/ForgotPassword'
import ResetPassword   from './pages/ResetPassword'
import VerifyEmail     from './pages/VerifyEmail'
import ProtectedRoute  from './components/ProtectedRoute'
import AdminRoute      from './components/AdminRoute'
import './App.css'
import './auth.css'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/"                    element={<Home />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/register"            element={<Register />} />
          <Route path="/admin-login"         element={<AdminLogin />} />
          <Route path="/forgot-password"     element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Protected member route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
          } />

          {/* Protected admin route */}
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}

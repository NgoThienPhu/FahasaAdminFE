import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/dashboard'
import Users from './pages/users'
import Products from './pages/products'
import Orders from './pages/orders'
import './App.css'
import { ProtectedRouter } from './components/protected_router/ProtectedRouter'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRouter>
            <DashboardLayout />
          </ProtectedRouter>
        }>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

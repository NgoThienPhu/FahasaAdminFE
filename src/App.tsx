import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/login'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/dashboard'
import Users from './pages/users'
import Products from './pages/products'
import BookDetail from './pages/products/components/BookDetail'
import Orders from './pages/orders'
import Categories from './pages/categories'
import './App.css'
import { ProtectedRouter } from './components/protected_router/ProtectedRouter'
import Notification from './components/notification/Notification'

function App() {
  return (
    <BrowserRouter>
      <Notification />
      <Routes>
        <Route path="/login" element={
          <ProtectedRouter redirectIfAuth={true}>
            <Login />
          </ProtectedRouter>
        } />
        <Route path="/" element={
          <ProtectedRouter>
            <DashboardLayout />
          </ProtectedRouter>
        }>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Outlet />}>
            <Route index element={<Products />} />
            <Route path=":id" element={<BookDetail />} />
          </Route>
          <Route path="orders" element={<Orders />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard/index'
import SiteWidgets from './pages/SiteWidgets'
import SiteComments from './pages/SiteComments'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/dashboard' element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path='/dashboard/sites/:siteId' element={
          <ProtectedRoute><SiteWidgets /></ProtectedRoute>
        } />
        <Route path='/dashboard/sites/:siteId/comments' element={
          <ProtectedRoute><SiteComments /></ProtectedRoute>
        } />
        <Route path='*' element={<Navigate to='/login' />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
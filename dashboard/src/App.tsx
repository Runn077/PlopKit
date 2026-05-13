import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/dashboard' element={
          <ProtectedRoute><div>Sites list</div></ProtectedRoute>
        } />
        <Route path='/dashboard/sites/:siteId' element={
          <ProtectedRoute><div>Widgets</div></ProtectedRoute>
        } />
        <Route path='/dashboard/sites/:siteId/comments' element={
          <ProtectedRoute><div>Comments</div></ProtectedRoute>
        } />
        <Route path='*' element={<Navigate to='/login' />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
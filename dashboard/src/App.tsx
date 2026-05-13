import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/dashboard' element={<div>Sites list</div>} />
        <Route path='/dashboard/sites/:siteId' element={<div>Widgets</div>} />
        <Route path='/dashboard/sites/:siteId/comments' element={<div>Comments</div>} />
        <Route path='*' element={<Navigate to='/login' />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
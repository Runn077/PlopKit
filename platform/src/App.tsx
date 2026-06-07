import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard/index'
import SiteWidgets from './pages/SiteWidgets/index'
import SiteComments from './pages/SiteComments/index'
import Account from './pages/Account/index'
import Landing from './pages/Landing/Landing'
import PrivacyPolicy from './pages/Legal/PrivacyPolicy'
import Terms from './pages/Legal/Terms'
import Demo from './pages/Demo/Demo'
import Setup from './pages/Setup/Setup'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/demo' element={<Demo />} />
        <Route path='/setup' element={<Setup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/dashboard' element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path='/dashboard/sites/:siteId' element={
          <ProtectedRoute><SiteWidgets /></ProtectedRoute>
        } />
        <Route path='/dashboard/sites/:siteId/widgets/:widgetId/comments' element={
          <ProtectedRoute><SiteComments /></ProtectedRoute>
        } />
        <Route path='/account' element={
          <ProtectedRoute><Account /></ProtectedRoute>
        } />
        <Route path='*' element={<Navigate to='/login' />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
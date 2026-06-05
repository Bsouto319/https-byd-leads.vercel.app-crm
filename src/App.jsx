import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Form from './pages/Form'
import CRM from './pages/CRM'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route path="/crm" element={<CRM />} />
      </Routes>
    </BrowserRouter>
  )
}

import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Assets from '@/pages/Assets';
import Employees from '@/pages/Employees';
import Terms from '@/pages/Terms';
import Units from '@/pages/Units';
import Info from '@/pages/Info';
import Infos from '@/pages/Infos';
import Infraestrutura from '@/pages/Infraestrutura';
import Contatos from '@/pages/Contatos';
import Fornecedores from '@/pages/Fornecedores';
import ChipsCorporativos from '@/pages/ChipsCorporativos';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/unidades" element={<Units />} />
                <Route path="/ativos" element={<Assets />} />
                <Route path="/colaboradores" element={<Employees />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/informacoes" element={<Info />} />
                <Route path="/infraestrutura" element={<Infraestrutura />} />
                <Route path="/contatos" element={<Contatos />} />
                <Route path="/fornecedores" element={<Fornecedores />} />
                <Route path="/chips" element={<ChipsCorporativos />} />
                <Route path="/conhecimento" element={<KnowledgeBase />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

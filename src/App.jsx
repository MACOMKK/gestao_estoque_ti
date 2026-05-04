import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
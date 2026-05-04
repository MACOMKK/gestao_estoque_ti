import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const logoUrl = 'https://res.cloudinary.com/drevbr5eq/image/upload/q_auto/f_auto/v1777603989/logo_vermelha_e2aob2.png';
  const bgUrl =
    'https://res.cloudinary.com/drevbr5eq/image/upload/f_auto,q_auto,c_fill,w_2560,h_1440,fl_progressive/v1777911817/img-mitmotorts_jvikox.webp';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Falha ao autenticar. Verifique email e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="absolute inset-0 bg-black/72" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(193,18,31,0.25),transparent_45%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/30 bg-white/16 backdrop-blur-md shadow-2xl p-7 sm:p-8">
        <div className="mb-7 pb-5 border-b border-white/30 text-center">
          <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto" />
          <p className="mt-4 text-sm text-white/90">Entre com seu usuario corporativo.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          <div>
            <label className="block text-xs font-semibold tracking-wide text-white/90 mb-2">EMAIL</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com.br"
              required
              className="h-11 border-white/40 bg-white/85 text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-[#c1121f]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-white/90 mb-2">SENHA</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 border-white/40 bg-white/85 text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-[#c1121f]"
            />
          </div>

          {error && <p className="text-sm text-red-200 pt-1">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-1 bg-[#c1121f] hover:bg-[#a50f19] text-white font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}

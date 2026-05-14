import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Cpu } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch { setError('Invalid credentials'); }
    finally { setLoading(false); }
  };

  const handleDemo = () => {
    setEmail('admin@demo.com'); setPassword('demo123');
    setTimeout(() => { document.getElementById('login-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4"><Cpu className="w-8 h-8 text-gray-950" /></div>
          <h1 className="text-3xl font-bold text-white">SemiChain</h1>
          <p className="text-gray-400 mt-2">Semiconductor Supply Chain Intelligence</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
          <button onClick={handleDemo} className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors border border-gray-700">Demo Login</button>
        </div>
      </div>
    </div>
  );
}

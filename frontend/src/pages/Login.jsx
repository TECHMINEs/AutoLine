import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username.trim(), password);
    if (!result.success) setError(result.message);
    if (result.success) navigate('/home');
    setLoading(false);
  };

  return (
    <div className="auth-shell flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-mark.svg" alt="AutoLine logo" width={72} height={72} className="w-[72px] h-[72px] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white uppercase industrial-heading">Auto<span className="text-[#FF2626]">Line</span></h1>
          <p className="tm-label mt-2">Manufacturing management system</p>
        </div>

        <div className="auth-card p-8">
          <h2 className="text-lg font-semibold text-[#F3F4F4] mb-1 industrial-heading tracking-[0.12em]">Sign in</h2>
          <p className="text-sm text-[rgba(243,244,244,0.58)] mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Username</label>
              <input
                required
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-2.5 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(243,244,244,0.52)] hover:text-[#F3F4F4]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#FF2626] bg-[rgba(255,38,38,0.12)] border border-[rgba(255,38,38,0.22)] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 action-button text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
}

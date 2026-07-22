import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '../services/auth.service';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      await login({ identifier, password });
      onLogin();
      toast.success('Đăng nhập thành công');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không đăng nhập được');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <ShieldCheck size={30} />
          <div>
            <strong>Viora Admin</strong>
            <span>Trang quản trị hệ thống</span>
          </div>
        </div>
        <div>
          <h1>Đăng nhập</h1>
          <p>Nhập thông tin quản trị viên để tiếp tục.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label>
            Tài khoản
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            Mật khẩu
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          <button className="btn primary" disabled={loading} type="submit">
            <LockKeyhole size={16} />
            {loading ? 'Đang đăng nhập' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </main>
  );
}

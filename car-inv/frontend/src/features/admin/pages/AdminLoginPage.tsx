import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DocumentMetadata } from '../../../app/DocumentMetadata';
import { useHomepageContent } from '../../homepage/hooks/useHomepageContent';
import { AdminBrandLockup } from '../components/AdminBrandLockup';
import { useAdminLogin, useAdminSession } from '../hooks/useAdminSession';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const session = useAdminSession();
  const login = useAdminLogin();
  const { data: homepageContent } = useHomepageContent();
  const { brandName, brandMark } = homepageContent.site;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session.data) navigate('/admin', { replace: true });
  }, [navigate, session.data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate(
      { email: email.trim(), password },
      { onSuccess: () => navigate('/admin', { replace: true }) },
    );
  };

  return (
    <main className="admin-auth-page">
      <DocumentMetadata />
      <section className="admin-auth-brand-panel">
        <Link className="admin-brand-lockup" to="/" aria-label={`Back to ${brandName} homepage`}>
          <AdminBrandLockup brandName={brandName} brandMark={brandMark} />
        </Link>
        <div className="admin-auth-visual" aria-hidden="true">
          <div className="admin-auth-orbit admin-auth-orbit-one" />
          <div className="admin-auth-orbit admin-auth-orbit-two" />
          <div className="admin-auth-car-silhouette">D</div>
          <span className="admin-auth-pill admin-auth-pill-top">Curated inventory</span>
          <span className="admin-auth-pill admin-auth-pill-bottom">Admin workspace · 01</span>
        </div>
        <div className="admin-auth-brand-copy">
          <p className="admin-kicker">{brandName} CONTROL ROOM</p>
          <h1>Keep every detail worth driving home.</h1>
          <p>
            Manage your homepage, media library and buyer communications from one calm workspace.
          </p>
        </div>
      </section>

      <section className="admin-auth-form-panel">
        <div className="admin-auth-form-wrap">
          <div className="admin-auth-form-heading">
            <p className="admin-kicker">WELCOME BACK</p>
            <h2>Sign in to your workspace.</h2>
            <p>Use your administrator credentials to continue.</p>
          </div>

          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <label className="admin-field">
              <span>Email address</span>
              <span className="admin-field-control">
                <Mail size={17} aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@driva.example"
                  required
                />
              </span>
            </label>

            <label className="admin-field">
              <span>Password</span>
              <span className="admin-field-control">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  className="admin-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {login.isError ? (
              <p className="admin-form-error" role="alert">
                Sign-in failed. Check your credentials and try again.
              </p>
            ) : null}

            <button className="admin-submit-button" type="submit" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <p className="admin-auth-footer">
            <Link to="/">Return to the public website</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

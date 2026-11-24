import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, Activity } from 'lucide-react';
import '../../styles/auth.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email.trim(), password);

      // Redirect to intended path or role default
      const intendedPath = location.state?.from?.pathname;
      if (intendedPath && !intendedPath.includes('/login')) {
        navigate(intendedPath, { replace: true });
        return;
      }

      const role = user.role;

      switch(role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'RECEPTIONIST':
          navigate('/receptionist', { replace: true });
          break;
        case 'DOCTOR':
          navigate('/doctor', { replace: true });
          break;
        case 'PATIENT':
          navigate('/patient', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-unified-layout">
      <div className="auth-content-wrapper">
        
        {/* Left Side: Hero Branding */}
        <div className="auth-hero-section">
          <div className="auth-hero-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon-wrapper">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <div className="brand-text">
              MedPulse <span style={{ color: 'var(--color-teal-300)' }}>HMS</span>
            </div>
          </div>
          
          <h1 className="auth-hero-title">
            Smart Healthcare<br/>Management Platform
          </h1>
          
          <p className="auth-hero-subtitle">
            Manage Patients, Appointments, Billing and Clinical Records from one secure platform.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Check size={16} strokeWidth={3} />
              </div>
              Comprehensive Patient Management
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Check size={16} strokeWidth={3} />
              </div>
              Real-time Appointment Scheduling
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Check size={16} strokeWidth={3} />
              </div>
              Secure Medical Records & Reports
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Check size={16} strokeWidth={3} />
              </div>
              Integrated Billing & Payments
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            
            <div className="auth-form-header" style={{ color: 'white' }}>
              <h2>Welcome Back</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Please sign in to your account to continue</p>
            </div>

            {errorMsg && (
              <div className="error-banner">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="auth-glass-card">
              <form onSubmit={handleLogin} className="auth-form">
                
                <div className="floating-input-group">
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      required
                      className="form-input floating-input"
                      placeholder=" "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                    <label className="floating-label" htmlFor="email">Email Address</label>
                  </div>
                </div>

                <div className="floating-input-group">
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input floating-input"
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <label className="floating-label" htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-options">
                  <label className="remember-me">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <button type="button" className="forgot-password">
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit-btn"
                >
                  {loading ? 'Signing In...' : 'Sign In to Portal'}
                </button>
              </form>
            </div>
            
            {/* Footer */}
            <div className="auth-footer" style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              &copy; {new Date().getFullYear()} MedPulse Healthcare Systems. All rights reserved.<br />
              <span style={{ opacity: 0.8 }}>Version 2.4.0 (Enterprise Edition)</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthView = 'login' | 'register' | 'forgot-password' | 'verify-email' | 'reset-sent' | 'privacy' | 'terms';

// Password requirements checker
const checkPasswordRequirements = (password: string) => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
});

export default function Auth() {
  const [view, setView] = useState<AuthView>('login');
  const [previousView, setPreviousView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordReqs = checkPasswordRequirements(password);
  const allPasswordReqsMet = Object.values(passwordReqs).every(Boolean);

  // Check for OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError === 'oauth_failed') {
      setError('Google sign-in failed. Please try again or use email login.');
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const { login, register, forgotPassword, resendVerification } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    // Validate username
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    // Validate password requirements
    if (!allPasswordReqsMet) {
      setError('Please meet all password requirements');
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, password, name);
      if (result.requiresVerification) {
        setPendingEmail(email);
        setView('verify-email');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setPendingEmail(email);
      setView('reset-sent');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resendVerification(pendingEmail);
      setSuccess('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Google') {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const backendURL = apiUrl.replace(/\/api$/, '');
      window.location.href = `${backendURL}/api/auth/google`;
    } else {
      setError(`${provider} login coming soon! Please use email for now.`);
    }
  };

  const switchToLogin = () => {
    setView('login');
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchToRegister = () => {
    setView('register');
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const goToLegalPage = (page: 'privacy' | 'terms') => {
    setPreviousView(view);
    setView(page);
  };

  const goBackFromLegal = () => {
    setView(previousView);
  };

  // Privacy Policy View
  if (view === 'privacy') {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card-legal">
          <button className="legal-back-btn" onClick={goBackFromLegal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p className="legal-updated">Last updated: January 2026</p>
          </div>
          <div className="legal-content">
            <section>
              <h2>1. Information We Collect</h2>
              <p>When you create an account, we collect:</p>
              <ul>
                <li><strong>Account Information:</strong> Your name, email address, username, and password (encrypted).</li>
                <li><strong>Study Data:</strong> The study sets, questions, and answers you create.</li>
                <li><strong>Usage Data:</strong> How you interact with Questly, including study progress and preferences.</li>
              </ul>
            </section>
            <section>
              <h2>2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and improve our study platform</li>
                <li>Save your study sets and track your progress</li>
                <li>Send important account notifications</li>
                <li>Respond to your support requests</li>
              </ul>
            </section>
            <section>
              <h2>3. Data Security</h2>
              <p>We take security seriously:</p>
              <ul>
                <li>Passwords are encrypted using industry-standard hashing</li>
                <li>All data is transmitted over secure HTTPS connections</li>
                <li>We regularly review our security practices</li>
              </ul>
            </section>
            <section>
              <h2>4. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data only:</p>
              <ul>
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
              </ul>
            </section>
            <section>
              <h2>5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Delete your account and associated data</li>
                <li>Export your study sets</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>
            <section>
              <h2>6. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at support@questly.app</p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Terms of Service View
  if (view === 'terms') {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card-legal">
          <button className="legal-back-btn" onClick={goBackFromLegal}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <div className="legal-header">
            <h1>Terms of Service</h1>
            <p className="legal-updated">Last updated: January 2026</p>
          </div>
          <div className="legal-content">
            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using Questly, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
            </section>
            <section>
              <h2>2. Description of Service</h2>
              <p>Questly is an online study platform that allows users to create, share, and study question sets using various study modes including flashcards, quizzes, and games.</p>
            </section>
            <section>
              <h2>3. User Accounts</h2>
              <ul>
                <li>You must provide accurate information when creating an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must be at least 13 years old to use Questly</li>
                <li>One person may not maintain more than one account</li>
              </ul>
            </section>
            <section>
              <h2>4. User Content</h2>
              <p>You retain ownership of the study sets you create. By using Questly, you grant us a license to store and display your content to provide our services. You agree not to upload content that:</p>
              <ul>
                <li>Infringes on intellectual property rights</li>
                <li>Contains harmful, offensive, or illegal material</li>
                <li>Violates any applicable laws</li>
              </ul>
            </section>
            <section>
              <h2>5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use Questly for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the service</li>
                <li>Scrape or collect user data without permission</li>
              </ul>
            </section>
            <section>
              <h2>6. Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your account settings.</p>
            </section>
            <section>
              <h2>7. Disclaimer</h2>
              <p>Questly is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free.</p>
            </section>
            <section>
              <h2>8. Changes to Terms</h2>
              <p>We may update these terms from time to time. Continued use of Questly after changes constitutes acceptance of the new terms.</p>
            </section>
            <section>
              <h2>9. Contact</h2>
              <p>For questions about these Terms of Service, contact us at support@questly.app</p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Verify Email View
  if (view === 'verify-email') {
    return (
      <div className="auth-container">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="auth-logo auth-logo-success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2>Verify your email</h2>
            <p className="auth-subtitle">
              We've sent a verification link to<br/>
              <strong>{pendingEmail}</strong>
            </p>
          </div>

          <div className="verify-instructions">
            <div className="verify-step">
              <div className="step-number">1</div>
              <p>Check your email inbox</p>
            </div>
            <div className="verify-step">
              <div className="step-number">2</div>
              <p>Click the verification link</p>
            </div>
            <div className="verify-step">
              <div className="step-number">3</div>
              <p>Start studying!</p>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="verify-actions">
            <button
              className="btn-resend"
              onClick={handleResendVerification}
              disabled={loading}
            >
              {loading ? <span className="loading-spinner"></span> : 'Resend verification email'}
            </button>
            <button className="btn-back-to-login" onClick={switchToLogin}>
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password Sent View
  if (view === 'reset-sent') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo auth-logo-success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2>Check your email</h2>
            <p className="auth-subtitle">
              We've sent password reset instructions to<br/>
              <strong>{pendingEmail}</strong>
            </p>
          </div>

          <button className="btn-auth" onClick={switchToLogin}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Forgot Password View
  if (view === 'forgot-password') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2>Forgot password?</h2>
            <p className="auth-subtitle">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <span className="loading-spinner"></span> : 'Send reset link'}
            </button>
          </form>

          <button className="btn-back-to-login" onClick={switchToLogin}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Login/Register Views
  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Enhanced Header with Questly Branding */}
        <div className="auth-header auth-header-branded">
          <div className="auth-brand">
            <img src="/Questly.png" alt="Questly" className="auth-brand-logo" />
            <span className="auth-brand-name">Questly</span>
          </div>
          <h2>{view === 'login' ? 'Welcome back!' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {view === 'login'
              ? 'Sign in to continue your learning journey'
              : 'Join thousands of students mastering their studies'}
          </p>
        </div>

        {/* Social Login - Only Google for now */}
        <div className="social-login-buttons">
          <button className="btn-social btn-google" onClick={() => handleSocialLogin('Google')}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
          {view === 'register' && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Username</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Choose a username"
                    required
                    maxLength={20}
                  />
                </div>
                <p className="input-hint">3-20 characters, letters, numbers, and underscores only</p>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label>Password</label>
              {view === 'login' && (
                <button
                  type="button"
                  className="btn-forgot"
                  onClick={() => setView('forgot-password')}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={view === 'login' ? 'Enter your password' : 'Create a password'}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Password Requirements - Only show on register */}
            {view === 'register' && password.length > 0 && (
              <div className="password-requirements">
                <div className={`req-item ${passwordReqs.minLength ? 'met' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {passwordReqs.minLength ? (
                      <polyline points="20 6 9 17 4 12"/>
                    ) : (
                      <circle cx="12" cy="12" r="10"/>
                    )}
                  </svg>
                  <span>At least 8 characters</span>
                </div>
                <div className={`req-item ${passwordReqs.hasUppercase ? 'met' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {passwordReqs.hasUppercase ? (
                      <polyline points="20 6 9 17 4 12"/>
                    ) : (
                      <circle cx="12" cy="12" r="10"/>
                    )}
                  </svg>
                  <span>One uppercase letter</span>
                </div>
                <div className={`req-item ${passwordReqs.hasLowercase ? 'met' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {passwordReqs.hasLowercase ? (
                      <polyline points="20 6 9 17 4 12"/>
                    ) : (
                      <circle cx="12" cy="12" r="10"/>
                    )}
                  </svg>
                  <span>One lowercase letter</span>
                </div>
                <div className={`req-item ${passwordReqs.hasNumber ? 'met' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {passwordReqs.hasNumber ? (
                      <polyline points="20 6 9 17 4 12"/>
                    ) : (
                      <circle cx="12" cy="12" r="10"/>
                    )}
                  </svg>
                  <span>One number</span>
                </div>
              </div>
            )}
          </div>

          {view === 'register' && (
            <>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="input-error">Passwords do not match</p>
                )}
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="terms-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    I agree to the{' '}
                    <button type="button" onClick={() => goToLegalPage('terms')}>Terms of Service</button>
                    {' '}and{' '}
                    <button type="button" onClick={() => goToLegalPage('privacy')}>Privacy Policy</button>
                  </span>
                </label>
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : view === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="auth-switch">
          {view === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={switchToRegister}>Sign up</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={switchToLogin}>Sign in</button>
            </p>
          )}
        </div>

        {view === 'login' && (
          <p className="auth-terms">
            By signing in, you agree to our{' '}
            <button type="button" onClick={() => goToLegalPage('terms')}>Terms of Service</button> and{' '}
            <button type="button" onClick={() => goToLegalPage('privacy')}>Privacy Policy</button>
          </p>
        )}
      </div>
    </div>
  );
}

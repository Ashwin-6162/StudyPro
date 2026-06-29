import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  BrainCircuit, Eye, EyeOff, Mail, Lock, User, 
  ArrowRight, AlertCircle, CheckCircle2, Loader2, Sparkles, Network
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ToggleSwitch } from '../../components/ui/FormControls';
import useStore from '../../store/useStore';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useStore((state) => state.login);
  const from = location.state?.from?.pathname || '/';

  // State Management
  const [view, setView] = useState('login'); // login, register, forgot, verify
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form field values
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' }); // type: error | success

  // Derive a display name from an email address (e.g. john.doe@x.com -> John Doe)
  const nameFromEmail = (email) => {
    const local = email.split('@')[0] || 'Student';
    return local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Form Handlers
  const handleSimulatedSubmit = (e, nextView = null, forceSuccess = false, provider = null) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    setTimeout(() => {
      setIsLoading(false);

      if (nextView === 'dashboard' || forceSuccess) {
        // Build user details from what was actually entered
        let resolvedName, resolvedEmail;
        if (provider === 'google') {
          resolvedName = 'Google User';
          resolvedEmail = emailInput || 'user@gmail.com';
        } else if (provider === 'microsoft') {
          resolvedName = 'Microsoft User';
          resolvedEmail = emailInput || 'user@outlook.com';
        } else {
          resolvedEmail = emailInput || 'student@studypro.com';
          resolvedName = fullName.trim() || nameFromEmail(resolvedEmail);
        }

        login({
          name: resolvedName,
          email: resolvedEmail,
          picture: null,
        }, 'fake-jwt-token-123');
        navigate(from, { replace: true });
      } else if (nextView) {
        setView(nextView);
        if (nextView === 'verify') {
          setMessage({ type: 'success', text: 'Verification code sent to your email.' });
        }
      } else {
        setMessage({ type: 'error', text: 'Invalid credentials. Please try again.' });
      }
    }, 1500);
  };

  // ─── Real Google OAuth login ──────────────────────────────────────────────
  // Uses the access token to fetch the real profile (name, email, photo) from Google
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch Google profile');
        const profile = await res.json();
        // profile contains: name, email, picture, given_name, family_name, etc.
        login({
          name: profile.name || nameFromEmail(profile.email || ''),
          email: profile.email || '',
          picture: profile.picture || null,
        }, tokenResponse.access_token);
        navigate(from, { replace: true });
      } catch (err) {
        setMessage({ type: 'error', text: 'Google sign-in failed. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Google sign-in was cancelled or failed.' });
    },
  });

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const MicrosoftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0H0v10h10V0z" fill="#f25022"/>
      <path d="M21 0H11v10h10V0z" fill="#7fba00"/>
      <path d="M10 11H0v10h10V11z" fill="#00a4ef"/>
      <path d="M21 11H11v10h10V11z" fill="#ffb900"/>
    </svg>
  );

  const renderFormContent = () => {
    switch (view) {
      case 'register':
        return (
          <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="auth-header">
              <h2>Create an account</h2>
              <p>Start your journey with AI-powered learning.</p>
            </div>
            
            {message.text && (
              <div className={`auth-message ${message.type} mt-4`}>
                {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {message.text}
              </div>
            )}

            <form className="auth-form mt-6" onSubmit={(e) => handleSimulatedSubmit(e, 'verify')}>
              <Input label="Full Name" placeholder="John Doe" iconLeft={User} value={fullName} onChange={e => setFullName(e.target.value)} required />
              <Input label="Email" type="email" placeholder="john@university.edu" iconLeft={Mail} value={emailInput} onChange={e => setEmailInput(e.target.value)} required />
              <div className="relative">
                <Input 
                  label="Password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Create a strong password" 
                  iconLeft={Lock} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
                <button type="button" className="absolute right-3 top-[34px] text-muted hover:text-primary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Button type="submit" variant="primary" fullWidth size="large" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </Button>
            </form>
            <div className="auth-footer">
              Already have an account? <span className="auth-link" onClick={() => setView('login')}>Sign in</span>
            </div>
          </motion.div>
        );

      case 'forgot':
        return (
          <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="auth-header">
              <h2>Reset password</h2>
              <p>Enter your email and we'll send you a recovery link.</p>
            </div>
            
            <form className="auth-form mt-6" onSubmit={(e) => {
              e.preventDefault();
              setIsLoading(true);
              setTimeout(() => {
                setIsLoading(false);
                setMessage({ type: 'success', text: 'Recovery link sent to your email.' });
              }, 1500);
            }}>
              {message.text && (
                <div className={`auth-message ${message.type} mb-4`}>
                  {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  {message.text}
                </div>
              )}
              <Input label="Email" type="email" placeholder="john@university.edu" iconLeft={Mail} required />
              <Button type="submit" variant="primary" fullWidth size="large" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Send Recovery Link'}
              </Button>
            </form>
            <div className="auth-footer">
              Remember your password? <span className="auth-link" onClick={() => { setView('login'); setMessage({type:'', text:''}); }}>Back to Sign in</span>
            </div>
          </motion.div>
        );

      case 'verify':
        return (
          <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="auth-header">
              <h2>Verify your email</h2>
              <p>We've sent a 6-digit code to your email address.</p>
            </div>
            
            {message.text && (
              <div className={`auth-message ${message.type} mt-4`}>
                <CheckCircle2 size={16} />
                {message.text}
              </div>
            )}

            <form className="auth-form mt-6" onSubmit={(e) => handleSimulatedSubmit(e, 'dashboard', true)}>
              <Input label="Verification Code" placeholder="000000" style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '20px' }} required />
              <Button type="submit" variant="primary" fullWidth size="large" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Verify Account'}
              </Button>
            </form>
            <div className="auth-footer">
              Didn't receive the code? <span className="auth-link" onClick={() => setMessage({type:'success', text:'New code sent.'})}>Resend</span>
            </div>
          </motion.div>
        );

      case 'login':
      default:
        return (
          <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="auth-header">
              <h2>Welcome back</h2>
              <p>Sign in to access your AI-powered workspace.</p>
            </div>

            {message.text && (
              <div className={`auth-message ${message.type} mt-4`}>
                {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {message.text}
              </div>
            )}

            <div className="auth-social-buttons mt-6">
              <button className="btn-social" onClick={() => googleLogin()} disabled={isLoading}>
                <GoogleIcon /> Continue with Google
              </button>
              <button className="btn-social" onClick={(e) => handleSimulatedSubmit(e, 'dashboard', true, 'microsoft')}>
                <MicrosoftIcon /> Continue with Microsoft
              </button>
            </div>

            <div className="auth-divider">or sign in with email</div>

            <form className="auth-form" onSubmit={(e) => handleSimulatedSubmit(e, 'dashboard', true)}>
              <Input label="Email" type="email" placeholder="john@university.edu" iconLeft={Mail} value={emailInput} onChange={e => setEmailInput(e.target.value)} required />
              
              <div className="relative">
                <Input 
                  label="Password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter your password" 
                  iconLeft={Lock} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
                <button type="button" className="absolute right-3 top-[34px] text-muted hover:text-primary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="auth-options">
                <ToggleSwitch label="Remember me" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <span className="auth-link text-sm" onClick={() => { setView('forgot'); setMessage({type:'', text:''}); }}>Forgot password?</span>
              </div>

              <Button type="submit" variant="primary" fullWidth size="large" icon={isLoading ? Loader2 : ArrowRight} className={isLoading ? 'animate-pulse' : ''} disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="auth-footer">
              Don't have an account? <span className="auth-link" onClick={() => { setView('register'); setMessage({type:'', text:''}); }}>Sign up</span>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="auth-page-container">
      {/* HERO SECTION */}
      <div className="auth-hero-section">
        <div className="hero-background-pattern" />
        
        <div className="hero-content">
          <div className="flex items-center gap-3 mb-16 text-white font-bold text-2xl">
            <BrainCircuit size={32} /> StudyPro
          </div>
          
          <h1 className="hero-title">
            Your intelligence,<br />
            amplified.
          </h1>
          <p className="hero-subtitle">
            Upload study materials and instantly generate answers, diagrams, quizzes, and mock exams perfectly tailored to your university standards.
          </p>

          <div className="hero-illustration">
            <div className="hero-illustration-mockup">
              <div className="mockup-header">
                <div className="mockup-dot bg-error" />
                <div className="mockup-dot bg-warning" />
                <div className="mockup-dot bg-success" />
              </div>
              <div className="mockup-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/20 rounded-xl text-primary"><Sparkles size={24} /></div>
                  <div className="flex-1">
                    <div className="mockup-line w-3/4 mb-2 bg-primary/20" />
                    <div className="mockup-line w-1/2" />
                  </div>
                </div>
                <div className="mockup-line w-full" />
                <div className="mockup-line w-full" />
                <div className="mockup-line w-5/6" />
                
                <div className="mt-4 p-4 border border-white/10 rounded-lg flex items-center justify-center bg-black/5">
                  <Network className="text-white/40" size={32} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-logo lg:hidden text-primary">
            <BrainCircuit size={32} /> StudyPro
          </div>

          <AnimatePresence mode="wait">
            {renderFormContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/useToast';
import { Mail, Lock, LogIn, UserPlus, LogOut, User } from 'lucide-react';

export default function AuthForm() {
    const { user, signUp, signIn, signOut, loading } = useAuth();
    const { addToast } = useToast();

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            addToast('Please enter email and password', 'error');
            return;
        }

        if (password.length < 6) {
            addToast('Password must be at least 6 characters', 'error');
            return;
        }

        setSubmitting(true);

        try {
            if (mode === 'signup') {
                const { error } = await signUp(email, password);
                if (error) {
                    addToast(error.message, 'error');
                } else {
                    addToast('Account created! Check your email to confirm.', 'success');
                    setMode('signin');
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    addToast(error.message, 'error');
                } else {
                    addToast('Signed in successfully!', 'success');
                    setEmail('');
                    setPassword('');
                }
            }
        } catch (err) {
            addToast('An error occurred', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        addToast('Signed out', 'info');
    };

    if (loading) {
        return <div className="auth-loading">Loading...</div>;
    }

    // User is logged in - show account info
    if (user) {
        return (
            <div className="auth-logged-in">
                <div className="user-info">
                    <User size={16} />
                    <span>{user.email}</span>
                </div>
                <button onClick={handleSignOut} className="signout-btn">
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        );
    }

    // User is not logged in - show auth form
    return (
        <div className="auth-form-container">
            <div className="auth-tabs">
                <button
                    className={mode === 'signin' ? 'active' : ''}
                    onClick={() => setMode('signin')}
                >
                    Sign In
                </button>
                <button
                    className={mode === 'signup' ? 'active' : ''}
                    onClick={() => setMode('signup')}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-with-icon">
                    <Mail size={16} />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-with-icon">
                    <Lock size={16} />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={submitting}
                >
                    {mode === 'signin' ? (
                        <>
                            <LogIn size={16} />
                            {submitting ? 'Signing in...' : 'Sign In'}
                        </>
                    ) : (
                        <>
                            <UserPlus size={16} />
                            {submitting ? 'Creating account...' : 'Create Account'}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

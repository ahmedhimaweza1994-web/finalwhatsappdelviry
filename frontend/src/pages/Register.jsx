import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaWhatsapp } from 'react-icons/fa';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await register(email, password);
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            // Handle different error formats
            const errorMessage = err.response?.data?.error
                || err.response?.data?.message
                || err.message
                || (typeof err === 'string' ? err : 'Registration failed. Please try again.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-wa-teal flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-wa-panel-dark rounded-lg shadow-wa-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <FaWhatsapp className="text-wa-green text-5xl mr-2" />
                        <h1 className="text-3xl font-semibold text-wa-text dark:text-wa-text-dark">
                            ChatVault
                        </h1>
                    </div>
                    <p className="text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        Create your account
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-wa-text dark:text-wa-text-dark mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-wa-border dark:border-wa-border-dark bg-white dark:bg-wa-received-dark text-wa-text dark:text-wa-text-dark focus:outline-none focus:ring-2 focus:ring-wa-green"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-wa-text dark:text-wa-text-dark mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-wa-border dark:border-wa-border-dark bg-white dark:bg-wa-received-dark text-wa-text dark:text-wa-text-dark focus:outline-none focus:ring-2 focus:ring-wa-green"
                            placeholder="••••••••"
                            minLength={8}
                        />
                        <p className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark mt-1">
                            Minimum 8 characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-wa-text dark:text-wa-text-dark mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-wa-border dark:border-wa-border-dark bg-white dark:bg-wa-received-dark text-wa-text dark:text-wa-text-dark focus:outline-none focus:ring-2 focus:ring-wa-green"
                            placeholder="••••••••"
                            minLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-wa-green hover:bg-wa-green-dark text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <div className="spinner mr-2"></div>
                                Creating account...
                            </>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-wa-text-secondary dark:text-wa-text-secondary-dark">
                    Already have an account?{' '}
                    <Link to="/login" className="text-wa-green hover:text-wa-green-dark font-medium">
                        Sign in
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-wa-panel text-sm">
                <p>🔒 Your data is 100% private and self-hosted</p>
            </div>
        </div>
    );
};

export default Register;

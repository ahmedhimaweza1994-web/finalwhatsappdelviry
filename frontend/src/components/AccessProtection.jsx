import React, { useState, useEffect } from 'react';
import { FaLock, FaArrowRight } from 'react-icons/fa';

const AccessProtection = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if already authorized
        const accessGranted = localStorage.getItem('site_access_granted');
        if (accessGranted === 'true') {
            setIsAuthorized(true);
        }
        setLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (code === 'Ahmed2025') {
            localStorage.setItem('site_access_granted', 'true');
            setIsAuthorized(true);
            setError('');
        } else {
            setError('Incorrect security code');
            setCode('');
        }
    };

    if (loading) return null;

    if (isAuthorized) {
        return children;
    }

    return (
        <div className="fixed inset-0 bg-[#111b21] z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#202c33] w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[#2a3942]">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#00a884] rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <FaLock className="text-white text-2xl" />
                    </div>
                    <h1 className="text-[#e9edef] text-2xl font-bold">Security Check</h1>
                    <p className="text-[#8696a0] text-center mt-2">
                        Please enter the access code to proceed to ChatVault.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter Access Code"
                            className="w-full bg-[#2a3942] text-[#e9edef] px-4 py-3 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:outline-none transition-colors text-center text-lg tracking-widest placeholder:tracking-normal"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-400 text-sm text-center mt-2 animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Access Application
                        <FaArrowRight />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[#8696a0] text-xs">
                        Protected by ChatVault Security
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessProtection;

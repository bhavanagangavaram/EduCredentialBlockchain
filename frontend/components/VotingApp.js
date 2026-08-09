'use client';

import { useState } from 'react';
import { connectWallet, getContract } from '../utils/web3';
import VotingArtifact from '../utils/Voting.json';
import AdminMode from './AdminMode';
import UserMode from './UserMode';
import config from '../utils/config';

const VOTING_ABI = VotingArtifact.abi;
const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
const BACKEND_NODE_URL = config.BACKEND_URL;

/* ── Inline SVG Icons ── */
const ShieldIcon = ({ className = "icon-lg" }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const WalletIcon = ({ className = "icon-md" }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
);

const LockIcon = ({ className = "icon-sm" }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const ScanIcon = ({ className = "icon-sm" }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24">
        <path d="M2 7V2h5M17 2h5v5M2 17v5h5M17 22h5v-5" />
        <circle cx="12" cy="12" r="4" />
    </svg>
);

const LinkIcon = ({ className = "icon-sm" }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

export default function VotingApp() {
    const [mode, setMode] = useState('user');
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');

    const handleConnect = async () => {
        setConnecting(true);
        setConnectError('');
        try {
            const { signer, address } = await connectWallet();
            setAccount(address);
            const contractInstance = getContract(CONTRACT_ADDRESS, VOTING_ABI, signer);
            setContract(contractInstance);
        } catch (err) {
            console.error(err);
            if (err.message && err.message.includes('Metamask not found')) {
                setConnectError('MetaMask not detected. Please install the MetaMask browser extension to continue.');
            } else if (err.message && err.message.includes('pending')) {
                setConnectError('A connection request is already pending. Please check your MetaMask extension.');
            } else {
                setConnectError(err.message || 'Failed to connect wallet.');
            }
        }
        setConnecting(false);
    };

    const handleDisconnect = () => {
        setAccount(null);
        setContract(null);
    };

    const handleModeSwitch = (newMode) => {
        if (mode !== newMode) {
            handleDisconnect();
            setMode(newMode);
        }
    };

    return (
        <div className="min-h-screen text-white flex flex-col">
            {/* ── Navbar ── */}
            <nav className="glass-nav sticky top-0 z-40 nav-accent">
                <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center px-4 sm:px-6 py-3 gap-2">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <span className="text-purple-400"><ShieldIcon className="icon-lg" /></span>
                        <span className="text-lg font-bold tracking-tight text-white">
                            E-Voting
                        </span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => handleModeSwitch('admin')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'admin'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => handleModeSwitch('user')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Voter
                        </button>
                    </div>

                    {/* Wallet */}
                    <div>
                        {account ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-xl">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-sm font-mono text-green-400">
                                        {account.slice(0, 6)}…{account.slice(-4)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleDisconnect}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Disconnect"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleConnect} disabled={connecting} className="btn-primary text-sm !py-2 !px-5">
                                {connecting ? <><span className="spinner mr-2" /> Connecting…</> : 'Connect Wallet'}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Content ── */}
            <main className="flex-1 max-w-5xl mx-auto mt-8 px-4 pb-16 w-full">
                {!account ? (
                    /* ── Welcome Screen ── */
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in">
                        <div className="text-purple-400 mb-8 animate-float">
                            <svg className="icon icon-hero" viewBox="0 0 24 24" style={{ width: '5rem', height: '5rem' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-white leading-tight">
                            AI-Integrated Decentralized E-Voting System
                        </h1>
                        <p className="text-gray-400 text-center max-w-lg mb-10 text-lg leading-relaxed">
                            Secure, transparent, and inclusive elections powered by Ethereum Blockchain.
                        </p>
                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="btn-primary text-lg !py-4 !px-10 animate-glow"
                        >
                            {connecting ? <><span className="spinner mr-2" /> Connecting…</> : 'Connect MetaMask'}
                        </button>
                        {connectError && (
                            <div className="status-error mt-6 px-5 py-3 rounded-xl text-sm font-medium max-w-md text-center animate-fade-in flex items-center gap-2 justify-center">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {connectError}
                            </div>
                        )}
                        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-16 text-gray-500 text-sm">
                            <span className="flex items-center gap-2"><LockIcon /> End-to-End Encrypted</span>
                            <span className="flex items-center gap-2"><ScanIcon /> Face Verified</span>
                            <span className="flex items-center gap-2"><LinkIcon /> Immutable Record</span>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {mode === 'admin' ? (
                            <AdminMode account={account} contract={contract} backendUrl={BACKEND_NODE_URL} />
                        ) : (
                            <UserMode account={account} contract={contract} backendUrl={BACKEND_NODE_URL} />
                        )}
                    </div>
                )}
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 py-6 mt-auto">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <ShieldIcon className="icon-sm" />
                        <span>AI-Integrated Decentralized E-Voting System</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {['Ethereum', 'Solidity', 'Next.js', 'Face API', 'RSA Encryption'].map(tech => (
                            <span key={tech} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/5 font-medium">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}

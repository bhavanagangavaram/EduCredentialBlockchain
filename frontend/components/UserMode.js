import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import JSEncrypt from 'jsencrypt';
import { checkInternetConnection } from '../utils/internetCheck';
import { auth } from '../utils/firebaseConfig';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import config from '../utils/config';

/* ── Inline SVG Icons ── */
const CheckCircleIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: '4rem', height: '4rem', color: '#34d399' }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default function UserMode({ account, contract, backendUrl }) {
    const [step, setStep] = useState(1);
    const [voterData, setVoterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('info'); // 'info' | 'success' | 'error'

    const [otpSms, setOtpSms] = useState('');
    const [otpEmail, setOtpEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const webcamRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [updateData, setUpdateData] = useState({ mobile: "", email: "" });

    const setMsg = (text, type = 'info') => { setMessage(text); setMsgType(type); };

    // Auto-dismiss success/info messages after 8 seconds
    useEffect(() => {
        if (message && msgType !== 'error') {
            const timer = setTimeout(() => setMessage(''), 8000);
            return () => clearTimeout(timer);
        }
    }, [message, msgType]);

    // Helper: Mask mobile number for privacy (e.g. +91****1234)
    const maskMobile = (mobile) => {
        if (!mobile || mobile.length < 4) return mobile;
        return mobile.slice(0, mobile.length > 6 ? -4 : -2).replace(/./g, '*') + mobile.slice(mobile.length > 6 ? -4 : -2);
    };
    // Helper: Mask email for privacy (e.g. b***a@gmail.com)
    const maskEmail = (email) => {
        if (!email || !email.includes('@')) return email;
        const [user, domain] = email.split('@');
        if (user.length <= 2) return user[0] + '***@' + domain;
        return user[0] + '***' + user.slice(-1) + '@' + domain;
    };

    useEffect(() => {
        const loadInit = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            if (contract) {
                const cands = await contract.getCandidates();
                setCandidates(cands.map(c => ({ id: c.id, name: c.name, voteCount: c.voteCount })));
            }
        };
        loadInit();
    }, [contract]);

    /* ── Step 1: Verify Wallet ── */
    const verifyWallet = async () => {
        setLoading(true);
        const connection = await checkInternetConnection();
        if (!connection.sufficient) { setMsg(connection.message, 'error'); setLoading(false); return; }
        if (localStorage.getItem("hasVoted") === "true") {
            setMsg("This device has already cast a vote", 'error'); setLoading(false); return;
        }

        // --- ENFORCE ELECTION DATES ---
        try {
            const dateRes = await fetch(`${backendUrl}/admin/election-dates`);
            const dateData = await dateRes.json();
            if (dateData.startDate && dateData.endDate) {
                const now = new Date();
                const start = new Date(dateData.startDate);
                const end = new Date(dateData.endDate);

                if (now < start) {
                    setMsg(`Election has not started yet. Begins: ${start.toLocaleString()}`, 'error');
                    setLoading(false);
                    return;
                }
                if (now > end) {
                    setMsg(`Election has ended. Closed on: ${end.toLocaleString()}`, 'error');
                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.warn("Could not fetch election dates", e);
        }

        try {
            const res = await fetch(`${backendUrl}/voter/${account}?t=${Date.now()}`, { cache: "no-store" });
            const data = await res.json();
            if (res.ok) {
                setVoterData(data);
                setMsg("Wallet verified — proceed to face scan", 'success');
                setStep(2);
            } else {
                setMsg("Wallet not registered. Contact an administrator.", 'error');
            }
        } catch (e) {
            setMsg("Cannot connect to server", 'error');
        }
        setLoading(false);
    };

    const OTP_SERVICE_URL = config.OTP_SERVICE_URL;

    const handleUpdate = async () => {
        if (!updateData.mobile || !updateData.email) { setMsg("Enter both mobile and email", 'error'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/admin/update-voter`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: account, mobile: updateData.mobile, email: updateData.email })
            });
            const data = await res.json();
            if (res.ok) {
                setMsg("Details updated", 'success');
                setVoterData({ ...voterData, mobile: updateData.mobile, email: updateData.email });
                setIsEditing(false);
            } else { setMsg("Update failed: " + data.error, 'error'); }
        } catch (e) { setMsg("Error: " + e.message, 'error'); }
        setLoading(false);
    };

    /* ── Step 2: Verify Face ── */
    const verifyFace = async () => {
        if (!webcamRef.current) return;
        setLoading(true);
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) { setMsg("Camera error", 'error'); setLoading(false); return; }
        const img = new Image();
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Image load failed"));
                img.src = imageSrc;
            });
        } catch (e) { setMsg("Image processing failed", 'error'); setLoading(false); return; }

        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
        const allDetections = await faceapi.detectAllFaces(img, detectionOptions).withFaceLandmarks().withFaceDescriptors();
        if (allDetections.length === 0) { setMsg("No face detected — ensure good lighting", 'error'); setLoading(false); return; }
        if (allDetections.length > 1) { setMsg("Multiple faces detected — process blocked", 'error'); setLoading(false); return; }

        const detection = allDetections[0];
        if (voterData) {
            const storedDescriptor = new Float32Array(JSON.parse(voterData.face_descriptor));
            const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
            if (distance < 0.65) {
                setMsg("Face verified — complete 3-factor authentication", 'success');
                setStep(3);
            } else {
                setMsg("Face does not match our records", 'error');
            }
        }
        setLoading(false);
    };

    /* ── Step 3a: Send OTPs ── */
    const sendOtps = async () => {
        setLoading(true); setMsg("Sending verification codes…");

        let smsData = { status: "error" };
        try {
            const smsRes = await fetch(`${OTP_SERVICE_URL}/send-sms`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: voterData.mobile })
            });
            if (!smsRes.ok) throw new Error(`HTTP ${smsRes.status}`);
            const text = await smsRes.text();
            try { smsData = JSON.parse(text); } catch (e) { smsData = { status: "error" }; }
        } catch (err) { smsData = { status: "error" }; }

        let emailData = { status: "error" };
        try {
            const emailRes = await fetch(`${OTP_SERVICE_URL}/send-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: voterData.email })
            });
            if (!emailRes.ok) throw new Error(`HTTP ${emailRes.status}`);
            const text = await emailRes.text();
            try { emailData = JSON.parse(text); } catch (e) { emailData = { status: "error" }; }
        } catch (err) { emailData = { status: "error" }; }

        let msgs = [];
        if (smsData.status === "success") {
            msgs.push("SMS sent");
            if (smsData.debugOtp) msgs.push(`[SMS: ${smsData.debugOtp}]`);
        } else msgs.push("SMS failed");
        if (emailData.status === "success") {
            msgs.push("Email sent");
            const fallbackOtp = emailData.debugOtp || emailData.mockOtp;
            if (fallbackOtp) msgs.push(`[Email OTP: ${fallbackOtp}]`);
        } else msgs.push("Email failed");

        const anySuccess = smsData.status === "success" || emailData.status === "success";
        setMsg(msgs.join(" · "), anySuccess ? 'success' : 'error');
        if (anySuccess) setOtpSent(true);
        setLoading(false);
    };

    /* ── Step 3b: Verify OTPs ── */
    const verifyDualOtp = async () => {
        setMsg("Verifying…"); setLoading(true);
        try {
            const res = await fetch(`${OTP_SERVICE_URL}/verify-dual-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: voterData.email, otp_email: otpEmail, mobile: voterData.mobile, otp_mobile: otpSms })
            });
            const data = await res.json();
            if (data.status === "success") {
                setStep(4); setMsg("Verification complete — you may now vote", 'success');
            } else { setMsg(data.message || "Verification failed", 'error'); }
        } catch (error) { setMsg("Network error during verification", 'error'); }
        setLoading(false);
    };

    /* ── Step 4: Cast Vote ── */
    const castVote = async (candidateId) => {
        setLoading(true);
        const connection = await checkInternetConnection();
        if (!connection.sufficient) { setMsg(connection.message, 'error'); setLoading(false); return; }
        if (localStorage.getItem("hasVoted") === "true") {
            setMsg("This device has already cast a vote", 'error'); setLoading(false); return;
        }

        // --- FINAL SECURE DATES CHECK ---
        try {
            const dateRes = await fetch(`${backendUrl}/admin/election-dates`);
            const dateData = await dateRes.json();
            if (dateData.startDate && dateData.endDate) {
                const now = new Date();
                const start = new Date(dateData.startDate);
                const end = new Date(dateData.endDate);

                if (now < start) {
                    setMsg(`Election has not started yet. Begins: ${start.toLocaleString()}`, 'error');
                    setLoading(false);
                    return;
                }
                if (now > end) {
                    setMsg(`Election has ended. Closed on: ${end.toLocaleString()}`, 'error');
                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.warn("Could not verify strict election dates during vote", e);
        }

        try {
            const publicKey = await contract.electionPublicKey();
            if (!publicKey) { setMsg("Election keys not set by admin", 'error'); setLoading(false); return; }
            const encryptor = new JSEncrypt();
            encryptor.setPublicKey(publicKey);
            const encryptedVote = encryptor.encrypt(candidateId.toString());
            if (!encryptedVote) { setMsg("Encryption failed", 'error'); setLoading(false); return; }
            const tx = await contract.vote(encryptedVote);
            await tx.wait();
            localStorage.setItem("hasVoted", "true");
            setMsg("Vote cast successfully!", 'success');
            setStep(5);
        } catch (e) { setMsg("Voting failed: " + (e.reason || e.message), 'error'); }
        setLoading(false);
    };

    /* ── Step Progress Bar ── */
    const steps = [
        { n: 1, label: 'Wallet' },
        { n: 2, label: 'Face' },
        { n: 3, label: 'OTP' },
        { n: 4, label: 'Vote' },
    ];

    const statusClass = msgType === 'error' ? 'status-error'
        : msgType === 'success' ? 'status-success' : 'status-info';

    return (
        <div className="glass-card p-8 min-h-[500px] relative">
            {/* ── Step Progress ── */}
            <div className="flex items-center justify-center mb-10">
                {steps.map((s, i) => (
                    <div key={s.n} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`step-dot ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`}>
                                {step > s.n ? '✓' : s.n}
                            </div>
                            <span className={`text-xs font-medium ${step >= s.n ? 'text-gray-300' : 'text-gray-600'}`}>{s.label}</span>
                        </div>
                        {i < steps.length - 1 && <div className={`step-line mx-3 min-w-[60px] ${step > s.n ? 'done' : ''}`} />}
                    </div>
                ))}
            </div>

            {/* ── Content ── */}
            <div key={step} className="flex flex-col items-center w-full animate-fade-in">

                {/* STEP 1 — Wallet */}
                {step === 1 && (
                    <div className="text-center max-w-md w-full space-y-6">
                        <div className="glass-card p-5 text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Connected Wallet</p>
                            <p className="font-mono text-purple-400 text-sm">{account}</p>
                        </div>
                        <button onClick={verifyWallet} disabled={loading} className="btn-primary w-full !py-3.5">
                            {loading ? <><span className="spinner mr-2" /> Checking…</> : 'Verify Registration'}
                        </button>

                        {voterData && !isEditing && (
                            <button onClick={() => { setUpdateData({ mobile: voterData.mobile, email: voterData.email }); setIsEditing(true); }}
                                className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                                Update Contact Info
                            </button>
                        )}

                        {isEditing && (
                            <div className="glass-card p-5 text-left space-y-3">
                                <h4 className="font-semibold text-white text-sm">Update Contact</h4>
                                <input className="input-glass w-full" placeholder="Mobile" value={updateData.mobile}
                                    onChange={(e) => setUpdateData({ ...updateData, mobile: e.target.value })} />
                                <input className="input-glass w-full" placeholder="Email" value={updateData.email}
                                    onChange={(e) => setUpdateData({ ...updateData, email: e.target.value })} />
                                <div className="flex gap-2">
                                    <button onClick={handleUpdate} disabled={loading} className="btn-success flex-1 !py-2 text-sm">Save</button>
                                    <button onClick={() => setIsEditing(false)} className="btn-ghost flex-1 !py-2 text-sm">Cancel</button>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-xs text-gray-500 mb-2">Need gas for voting on Sepolia?</p>
                            <button
                                onClick={async () => {
                                    setLoading(true); setMsg("Requesting Sepolia ETH…");
                                    try {
                                        const res = await fetch(`${backendUrl}/admin/faucet`, {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ wallet_address: account })
                                        });
                                        const data = await res.json();
                                        setMsg(res.ok ? data.message : "Error: " + data.error, res.ok ? 'success' : 'error');
                                    } catch (e) { setMsg("Request failed", 'error'); }
                                    setLoading(false);
                                }}
                                disabled={loading}
                                className="btn-ghost text-sm w-full"
                            >
                                Get 0.01 Sepolia ETH
                            </button>
                            <a href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" target="_blank" rel="noopener noreferrer"
                                className="block mt-2 text-[11px] text-purple-400 hover:text-purple-300 underline text-center"
                            >
                                External Sepolia Faucet →
                            </a>
                        </div>
                    </div>
                )}

                {/* STEP 2 — Face */}
                {step === 2 && (
                    <div className="text-center max-w-md w-full space-y-4">
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full" width={400} />
                        </div>
                        <button onClick={verifyFace} disabled={loading} className="btn-primary w-full !py-3.5">
                            {loading ? <><span className="spinner mr-2" /> Scanning…</> : 'Scan Face'}
                        </button>
                    </div>
                )}

                {/* STEP 3 — OTP */}
                {step === 3 && (
                    <div className="text-center space-y-5 max-w-sm w-full">
                        <div className="glass-card p-4 text-sm text-purple-300 border-purple-500/20 border">
                            <strong>3-Factor Authentication</strong>
                            <p className="text-gray-400 text-xs mt-1">Verify with codes sent to your registered contacts.</p>
                        </div>

                        <div id="recaptcha-container" className="justify-center flex" />

                        {!otpSent && (
                            <button onClick={sendOtps} disabled={loading} className="btn-primary w-full !py-3.5">
                                {loading ? <><span className="spinner mr-2" /> Sending…</> : 'Send Verification Codes'}
                            </button>
                        )}

                        {otpSent && (
                            <div className="space-y-4">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SMS Code</label>
                                    <input className="input-glass w-full text-center text-lg tracking-[0.3em] font-mono"
                                        placeholder="• • • • • •" value={otpSms}
                                        onChange={(e) => setOtpSms(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Code</label>
                                    <input className="input-glass w-full text-center text-lg tracking-[0.3em] font-mono"
                                        placeholder="• • • • • •" value={otpEmail}
                                        onChange={(e) => setOtpEmail(e.target.value)} />
                                </div>
                                <button onClick={verifyDualOtp} disabled={loading} className="btn-success w-full !py-3.5">
                                    {loading ? <><span className="spinner mr-2" /> Verifying…</> : 'Verify Identity'}
                                </button>
                            </div>
                        )}

                        <p className="text-xs text-gray-600">
                            {maskMobile(voterData?.mobile)} · {maskEmail(voterData?.email)}
                        </p>
                    </div>
                )}

                {/* STEP 4 — Vote */}
                {step === 4 && (
                    <div className="w-full relative max-w-2xl">
                        {/* Live Monitor PIP */}
                        {candidates.length > 0 && (
                            <div className="absolute -top-16 right-0 w-24 h-24 rounded-full border-2 border-red-500/60 overflow-hidden shadow-2xl z-10 bg-black">
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 left-0 right-0 text-[8px] text-white text-center bg-red-600/80 font-bold flex items-center justify-center gap-1">
                                    <span className="live-dot" /> LIVE
                                </div>
                            </div>
                        )}

                        <h3 className="text-xl font-bold text-white mb-6">Cast Your Vote</h3>
                        <div className="space-y-3">
                            {candidates.length === 0 ? (
                                <div className="glass-card p-8 text-center">
                                    <p className="text-gray-400">No candidates registered yet</p>
                                </div>
                            ) : (
                                candidates.map((cand) => (
                                    <button key={cand.id} onClick={async () => {
                                        setMsg("Verifying live face…");
                                        const imageSrc = webcamRef.current.getScreenshot();
                                        if (!imageSrc) { setMsg("Camera error", 'error'); return; }
                                        const img = new Image();
                                        try {
                                            await new Promise((resolve, reject) => {
                                                img.onload = resolve;
                                                img.onerror = () => reject(new Error("Failed"));
                                                img.src = imageSrc;
                                            });
                                        } catch (e) { setMsg("Image error", 'error'); return; }

                                        const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
                                        const allDetections = await faceapi.detectAllFaces(img, detectionOptions).withFaceLandmarks().withFaceDescriptors();
                                        if (allDetections.length === 0) { setMsg("No face detected", 'error'); return; }
                                        if (allDetections.length > 1) { setMsg("Multiple faces detected — blocked", 'error'); return; }
                                        const detection = allDetections[0];
                                        if (voterData) {
                                            const stored = new Float32Array(JSON.parse(voterData.face_descriptor));
                                            const dist = faceapi.euclideanDistance(detection.descriptor, stored);
                                            if (dist > 0.65) { setMsg("Face mismatch — cannot proceed", 'error'); return; }
                                        }
                                        castVote(cand.id);
                                    }} className="glass-card glass-card-hover w-full p-5 flex justify-between items-center cursor-pointer border border-purple-500/10 hover:border-purple-500/40">
                                        <span className="font-bold text-white text-lg">{cand.name}</span>
                                        <span className="bg-purple-500/20 text-purple-300 px-5 py-2 rounded-full text-sm font-semibold group-hover:bg-purple-600 transition">Vote</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 5 — Done */}
                {step === 5 && (
                    <div className="text-center py-12 animate-fade-in">
                        <div className="flex justify-center mb-6"><CheckCircleIcon /></div>
                        <h3 className="text-3xl font-bold text-white mb-3">Thank You!</h3>
                        <p className="text-gray-400">Your vote has been encrypted and recorded on the blockchain.</p>
                        <div className="mt-8 flex justify-center gap-6 text-gray-500 text-xs">
                            <span>Encrypted</span>
                            <span>On-Chain</span>
                            <span>Anonymous</span>
                        </div>
                    </div>
                )}

                {/* ── Status Message ── */}
                {message && (
                    <div className={`${statusClass} mt-6 px-5 py-3 rounded-xl text-sm font-medium w-full max-w-md text-center animate-pulse-once flex items-center justify-center gap-2`}>
                        {loading && <span className="spinner" />}
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

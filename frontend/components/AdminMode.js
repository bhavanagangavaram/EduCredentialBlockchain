import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import JSEncrypt from 'jsencrypt';
import secrets from 'secrets.js-grempe';
import config from '../utils/config';
import { STATIC_PUBLIC_KEY, STATIC_PRIVATE_KEY } from '../utils/demoKeys';
import { ethers } from 'ethers';

/* ── Inline SVG Icons ── */
const SearchIcon = () => (
    <svg className="icon icon-sm text-gray-400" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
);

const CameraIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: '3rem', height: '3rem' }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: '3.5rem', height: '3.5rem', color: '#34d399' }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

/* ── Searchable Voter Dropdown (for Booth Mode) ── */
const VoterLookup = ({ backendUrl, onSelect }) => {
    const [voters, setVoters] = useState([]);
    const [search, setSearch] = useState("");
    const [filtered, setFiltered] = useState([]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        fetch(`${backendUrl}/admin/voters`)
            .then(res => res.json())
            .then(data => { setVoters(data); setFiltered(data); })
            .catch(() => { });
    }, [backendUrl]);

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearch(e.target.value);
        setFiltered(voters.filter(v =>
            v.name.toLowerCase().includes(term) ||
            v.voter_id.toLowerCase().includes(term)
        ));
        setShow(true);
    };

    return (
        <div className="relative">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></span>
                <input
                    className="input-glass w-full !pl-10"
                    placeholder="Search by Name or Voter ID…"
                    value={search}
                    onFocus={() => setShow(true)}
                    onBlur={() => setTimeout(() => setShow(false), 200)}
                    onChange={handleSearch}
                />
            </div>
            {show && filtered.length > 0 && (
                <ul className="absolute z-20 w-full glass-card mt-1 max-h-56 overflow-y-auto border border-purple-500/20">
                    {filtered.map(v => (
                        <li
                            key={v.wallet_address}
                            className="px-4 py-3 hover:bg-purple-500/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                            onMouseDown={() => {
                                setSearch(`${v.name} — ${v.voter_id}`);
                                onSelect(v);
                                setShow(false);
                            }}
                        >
                            <div className="font-semibold text-white text-sm">{v.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{v.voter_id}</div>
                        </li>
                    ))}
                </ul>
            )}
            {show && filtered.length === 0 && search && (
                <div className="absolute z-20 w-full glass-card mt-1 p-4 text-center text-gray-500 text-sm">
                    No voters found
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════ ADMIN MODE ═══════════════════════════════════ */

export default function AdminMode({ contract, account }) {
    const backendUrl = config.BACKEND_URL;
    const [activeTab, setActiveTab] = useState('setup');
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(-1);
    const [formData, setFormData] = useState({ name: "", wallet: "", mobile: "", email: "", dob: "" });
    const [privateKeyShares, setPrivateKeyShares] = useState([]); // Array of 5 strings

    // For tally reconstruction
    const [tallyShares, setTallyShares] = useState(["", "", ""]);
    const [results, setResults] = useState([]);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [newCandidate, setNewCandidate] = useState("");
    const [partyName, setPartyName] = useState("");
    const [contractOwner, setContractOwner] = useState(null);

    // Election Dates
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [datesSaved, setDatesSaved] = useState(false);

    // Booth Mode States
    const [boothMode, setBoothMode] = useState(false);
    const [boothVoter, setBoothVoter] = useState(null);
    const [verifiedFaceDescriptor, setVerifiedFaceDescriptor] = useState(null);
    const [selectedVoterName, setSelectedVoterName] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [vvpat, setVvpat] = useState(null);
    const [isBoothUser, setIsBoothUser] = useState(false);
    const [processingVote, setProcessingVote] = useState(false);
    const [confirmingVote, setConfirmingVote] = useState(null); // Vote Confirmation State
    const [monitoringBlockedUntil, setMonitoringBlockedUntil] = useState(0); // Timestamp (0 = not blocked)
    const [faceViolation, setFaceViolation] = useState(null); // 'multiple' | 'unrecognized' | null
    const violationTimeRef = useRef(null);
    const [justRegisteredBoothVoter, setJustRegisteredBoothVoter] = useState(null);
    const [voteRejected, setVoteRejected] = useState(false); // Used for UI warning when MetaMask is rejected


    const webcamRef = useRef(null);

    // Auto-dismiss status messages after 8 seconds (non-error only)
    useEffect(() => {
        if (status && !status.includes('failed') && !status.includes('error') && !status.includes('Error') && !status.includes('❌')) {
            const timer = setTimeout(() => setStatus(''), 8000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utter);
        }
    };

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            if (contract) {
                try {
                    const c = await contract.getCandidates();
                    // Clean candidates data
                    const formatted = c.map(cand => ({
                        id: Number(cand.id),
                        name: cand.name,
                        voteCount: Number(cand.voteCount)
                    }));
                    setCandidates(formatted);

                    // Fetch Owner
                    const owner = await contract.owner();
                    setContractOwner(owner);
                } catch (e) {
                    console.error("Error loading contract data:", e);
                }
            }
        };
        loadModels();

        // Load saved election dates
        fetch(`${backendUrl}/admin/election-dates`)
            .then(res => res.json())
            .then(data => {
                if (data.startDate) { setStartDate(data.startDate); setEndDate(data.endDate); setDatesSaved(true); }
            })
            .catch(() => { });
    }, [contract, backendUrl]);

    // Helper: refresh candidates from blockchain
    const refreshCandidates = async () => {
        if (!contract) return;
        try {
            const c = await contract.getCandidates();
            setCandidates(c.map(cand => ({ id: Number(cand.id), name: cand.name, voteCount: Number(cand.voteCount) })));
        } catch (e) { console.error("Failed to refresh candidates:", e); }
    };

    // Live Monitoring Effect (Anti-Coercion & Voter Swap Detection)
    useEffect(() => {
        let monitorInterval;
        if (activeTab === 'booth' && boothMode && isCameraOn && !monitoringBlockedUntil) {
            monitorInterval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4 && webcamRef.current.video.videoWidth > 0 && webcamRef.current.video.videoHeight > 0) {
                    const video = webcamRef.current.video;
                    try {
                        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                            .withFaceLandmarks()
                            .withFaceDescriptors();

                        let currentViolation = null;

                        // Rule 1: Multiple Faces (Coercion)
                        if (detections.length > 1) {
                            currentViolation = 'multiple';
                        }
                        // Rule 2: Wrong Person (Voter Swapped / Looked Away)
                        else if (detections.length === 1 && verifiedFaceDescriptor) {
                            const liveDescriptor = detections[0].descriptor;
                            const distance = faceapi.euclideanDistance(liveDescriptor, verifiedFaceDescriptor);
                            // 0.45 is a strict threshold for matching the exact same person
                            if (distance > 0.45) {
                                currentViolation = 'unrecognized';
                            }
                        } else if (detections.length === 0) {
                            currentViolation = 'unrecognized'; // Also trigger if face is hidden
                        }

                        if (currentViolation) {
                            if (!violationTimeRef.current) {
                                violationTimeRef.current = Date.now();
                                setFaceViolation(currentViolation);
                            } else {
                                const elapsed = Date.now() - violationTimeRef.current;
                                if (elapsed > 5000) { // 5-second grace period!
                                    const blockedTime = Date.now() + (currentViolation === 'multiple' ? 180000 : 60000); // 3 mins or 1 min
                                    setMonitoringBlockedUntil(blockedTime);
                                    setStatus(`⚠️ ${currentViolation === 'multiple' ? "Multiple faces" : "Unrecognized face"}! Booth locked.`);
                                    speak(`${currentViolation === 'multiple' ? "Multiple faces detected" : "Unrecognized face"}. Booth locked.`);
                                    setBoothMode(false);
                                    setFaceViolation(null);
                                    violationTimeRef.current = null;
                                }
                            }
                        } else {
                            // Face is good again! Reset the violation
                            setFaceViolation(null);
                            violationTimeRef.current = null;
                        }

                    } catch (err) {
                        console.error("Monitoring error:", err);
                    }
                }
            }, 1000);
        } else {
            setFaceViolation(null);
            violationTimeRef.current = null;
        }
        return () => clearInterval(monitorInterval);
    }, [activeTab, boothMode, isCameraOn, monitoringBlockedUntil, setMonitoringBlockedUntil, setStatus, speak, verifiedFaceDescriptor]);

    /* ── 1. Generate/Load Election Keys ── */
    const generateKeys = async () => {
        setStatus("Loading election keys…");
        setLoading(true);
        setTimeout(async () => {
            try {
                setStatus("Approving on blockchain…");
                try {
                    setStatus("Confirm in MetaMask…");
                    const tx = await contract.setElectionPublicKey(STATIC_PUBLIC_KEY);
                    setStatus("Waiting for confirmation…");
                    await tx.wait();

                    // --- SHAMIR's SECRET SHARING ---
                    // Convert private key to hex for splitting
                    const hexPrivateKey = secrets.str2hex(STATIC_PRIVATE_KEY);
                    // Split into 5 shares, requiring 3 to reconstruct (threshold)
                    const shares = secrets.share(hexPrivateKey, 5, 3);
                    setPrivateKeyShares(shares);

                    setStatus("Keys split and uploaded successfully");
                } catch (e) {
                    setStatus("Transaction failed: " + (e.reason || e.message));
                }
            } catch (err) {
                setStatus("Error: " + err.message);
            }
            setLoading(false);
        }, 500);
    };

    /* ── 2. Register Voter ── */
    const captureAndRegister = async () => {
        if (!isCameraOn || (!webcamRef.current && !capturedImage)) { setStatus("Turn on camera first"); return; }
        setStatus("Capturing face…");
        setLoading(true);
        const imageSrc = capturedImage || webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc); // Freeze the frame in UI
        try {
            const img = await faceapi.fetchImage(imageSrc);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (!detections) { setStatus("No face detected"); setLoading(false); return; }
            const descriptor = JSON.stringify(Array.from(detections.descriptor));
            setStatus("Registering voter…");

            // Client-side Age Validation (from DOB)
            if (!formData.dob) {
                setStatus("Error: Date of Birth is required");
                setLoading(false);
                return;
            }
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                setStatus("Error: Voter must be 18+");
                setLoading(false);
                return;
            }

            const payload = new FormData();
            payload.append('name', formData.name);
            payload.append('wallet_address', formData.wallet);
            payload.append('voter_id', "VOTER_" + Date.now());
            payload.append('mobile', formData.mobile);
            payload.append('email', formData.email);
            payload.append('dob', formData.dob);
            payload.append('face_descriptor', descriptor);
            payload.append('face_image', imageSrc);
            const res = await fetch(`${backendUrl}/admin/register`, { method: 'POST', body: payload });
            const data = await res.json();
            if (res.ok) {
                setStatus("Registering on blockchain…");
                const tx = await contract.registerVoter(formData.wallet, data.faceHash);
                await tx.wait();
                
                setStatus("Voter registered. Auto-funding wallet with gas…");
                try {
                    await fetch(`${backendUrl}/admin/faucet`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ wallet_address: formData.wallet })
                    });
                } catch (faucetErr) {
                    console.warn("Auto-funding failed:", faucetErr);
                }

                setStatus("✅ Voter registered & funded successfully");
                setCapturedImage(null); // Clear image for next user
                if (isBoothUser) {
                    // Save info to proceed directly to booth
                    setJustRegisteredBoothVoter({
                        name: formData.name,
                        wallet: formData.wallet,
                        descriptor: JSON.parse(descriptor)
                    });
                } else {
                    setFormData({ name: "", wallet: "", mobile: "", email: "", dob: "" });
                }
            } else {
                setStatus("Backend error: " + data.error);
            }
        } catch (error) {
            console.error("Registration error:", error);
            if (error.message.includes("Voter already registered") || (error.reason && error.reason.includes("already registered"))) {
                setStatus("❌ Error: Wallet is ALREADY on Blockchain. Use a NEW wallet.");
            } else {
                setStatus("Failed: " + (error.reason || error.message));
            }
        }
        setLoading(false);
    };

    /* ── 3. Add Candidate ── */
    const addCandidate = async () => {
        if (!newCandidate) return;
        const displayName = partyName ? `${newCandidate} (${partyName})` : newCandidate;
        setStatus("Adding candidate…");
        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/admin/candidates`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: displayName })
            });
            if (!res.ok) throw new Error("Backend save failed");
            const tx = await contract.addCandidate(displayName);
            await tx.wait();
            setStatus(`"${displayName}" added successfully`);
            setNewCandidate(""); setPartyName("");
            await refreshCandidates();
        } catch (e) {
            setStatus("Error: " + (e.reason || e.message));
        }
        setLoading(false);
    };

    /* ── Save Election Dates ── */
    const saveDates = async () => {
        if (!startDate || !endDate) { setStatus("Select both dates"); return; }
        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/admin/election-dates`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate })
            });
            const data = await res.json();
            if (res.ok) { setStatus("Election dates saved"); setDatesSaved(true); }
            else setStatus("Error: " + data.error);
        } catch (e) { setStatus("Failed: " + e.message); }
        setLoading(false);
    };

    /* ── Reset Election Dates ── */
    const resetDates = async () => {
        if (!confirm("Reset election dates?")) return;
        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/admin/election-dates`, {
                method: 'DELETE'
            });
            if (res.ok) { setStartDate(''); setEndDate(''); setDatesSaved(false); setStatus('Election dates reset'); }
            else setStatus('Failed to reset dates');
        } catch (e) { setStatus('Error: ' + e.message); }
        setLoading(false);
    };

    /* ── 4. Reset ── */
    const resetCandidates = async () => {
        if (!confirm("This will permanently delete ALL candidates. Continue?")) return;
        setStatus("Resetting candidates…"); setLoading(true);
        try {
            // 1. Reset on blockchain FIRST (via MetaMask - owner account)
            const tx = await contract.resetCandidates();
            await tx.wait();

            // 2. Only clear JSON AFTER blockchain reset succeeds
            const res = await fetch(`${backendUrl}/admin/candidates`, { method: 'DELETE' });
            const data = await res.json();
            setStatus(res.ok ? "Candidates cleared from Blockchain AND Disk!" : "Error: " + data.error);
            if (res.ok) await refreshCandidates();
        } catch (e) { setStatus("Reset failed: " + (e.reason || e.message)); }
        setLoading(false);
    };

    const resetVoters = async () => {
        if (!confirm("This will permanently delete ALL registered voters. Continue?")) return;
        setStatus("Resetting voters…"); setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/admin/voters`, { method: 'DELETE' });
            const data = await res.json();
            setStatus(res.ok ? data.message : "Error: " + data.error);
        } catch (e) { setStatus("Reset failed: " + e.message); }
        setLoading(false);
    };

    /* ── 5. Tally (Reconstruct & Decrypt) ── */
    const tallyVotes = async () => {
        const validShares = tallyShares.map(s => s.trim()).filter(s => s.length > 0);
        if (validShares.length < 3) {
            setStatus("Error: You must provide at least 3 valid shares to tally.");
            return;
        }

        setStatus("Reconstructing private key from shares…");
        setLoading(true);

        try {
            // Reconstruct the hex private key
            const combinedHex = secrets.combine(validShares);
            // Convert back to string
            const reconstructedPrivateKey = secrets.hex2str(combinedHex);

            setStatus("Fetching voter data…");
            // Workaround for RPC providers limiting eth_getLogs block queries:
            // Fetch the registered wallets from the backend, then read the smart contract mapping directly!
            const res = await fetch(`${backendUrl}/admin/voters`);
            if (!res.ok) throw new Error("Database fetch failed");
            const allVoters = await res.json();

            setStatus("Decrypting votes from blockchain…");
            const decryptor = new JSEncrypt();
            decryptor.setPrivateKey(reconstructedPrivateKey);

            const counts = {};
            let ok = 0, fail = 0;

            const publicProvider = new ethers.JsonRpcProvider("https://1rpc.io/sepolia");
            // Clone the contract but attach it to our ultra-stable public read-only provider
            const targetAddress = contract.target || contract.address; 
            const readOnlyContract = new ethers.Contract(targetAddress, contract.interface, publicProvider);

            for (let v of allVoters) {
                try {
                    const voterRecord = await readOnlyContract.voters(v.wallet_address);
                    
                    // In Solidity, public mapping getters return tuples without parameter names.
                    // Index 0: isRegistered (bool)
                    // Index 1: hasVoted (bool)
                    // Index 2: encryptedVote (string)
                    // Index 3: faceHash (bytes32)
                    
                    const hasVoted = voterRecord[1];
                    const encryptedVote = voterRecord[2];

                    if (hasVoted && encryptedVote) {
                        const decryptedId = decryptor.decrypt(encryptedVote);
                        if (decryptedId !== false && decryptedId !== null) {
                            counts[decryptedId] = (counts[decryptedId] || 0) + 1;
                            ok++;
                        } else {
                            fail++;
                        }
                    }
                } catch (err) {
                    console.warn(`Could not read vote for ${v.wallet_address}`);
                }
            }

            if (fail > 0 && ok === 0) {
                setStatus("Error: Shares reconstructed an invalid key. Decryption failed.");
                setLoading(false);
                return;
            }

            const cands = await readOnlyContract.getCandidates();
            setResults(cands.map(c => ({ name: c.name, count: counts[c.id.toString()] || 0 })));
            setStatus(`Tally complete — ${ok} votes decrypted. (${fail} failed)`);
        } catch (e) {
            setStatus("Error: " + (e.reason || e.message));
            console.error("TALLY ERROR TRACE:", e);
        }
        setLoading(false);
    };

    /* ── 6. Booth Mode ── */
    const verifyForBooth = async () => {
        if (!isCameraOn || (!webcamRef.current && !capturedImage)) { setStatus("Turn on camera first"); return; }
        setStatus("Verifying voter…"); setLoading(true);
        const imageSrc = capturedImage || webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc); // Freeze the frame in UI
        try {
            // --- ENFORCE ELECTION DATES FOR BOOTH MODE ---
            const dateRes = await fetch(`${backendUrl}/admin/election-dates`);
            const dateData = await dateRes.json();
            if (dateData.startDate && dateData.endDate) {
                const now = new Date();
                const start = new Date(dateData.startDate);
                const end = new Date(dateData.endDate);

                if (now < start) throw new Error(`Election has not started yet. Begins: ${start.toLocaleString()}`);
                if (now > end) throw new Error(`Election has ended. Closed on: ${end.toLocaleString()}`);
            }

            const img = await faceapi.fetchImage(imageSrc);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (!detections) throw new Error("No face detected");
            if (!formData.wallet) throw new Error("Select a voter from the list first");

            const res = await fetch(`${backendUrl}/voter/${formData.wallet}?t=${Date.now()}`);
            if (!res.ok) throw new Error("Voter not found in database");
            const voterData = await res.json();

            const storedDescriptor = new Float32Array(JSON.parse(voterData.face_descriptor));
            const distance = faceapi.euclideanDistance(detections.descriptor, storedDescriptor);
            if (distance >= 0.65) throw new Error("Face DOES NOT match database records");

            const voter = await contract.voters(formData.wallet);
            if (!voter.isRegistered) throw new Error("Voter not registered on blockchain");
            if (voter.hasVoted) throw new Error("Voter has already voted");

            // Check if blocked
            if (Date.now() < monitoringBlockedUntil) {
                const remaining = Math.ceil((monitoringBlockedUntil - Date.now()) / 1000);
                throw new Error(`Booth blocked for ${remaining}s. Use override to reset.`);
            }

            setStatus(`Verified: ${selectedVoterName || formData.wallet.slice(0, 10) + '…'}`);
            setBoothVoter(formData.wallet);
            setVerifiedFaceDescriptor(detections.descriptor); // Store for continuous live monitoring
            speak("Voter verified. Starting booth mode.");
        } catch (e) {
            setStatus("Verification failed: " + (e.reason || e.message));
        }
        setLoading(false);
    };

    /* ── Helper: Auto-Gen Booth Credentials ── */
    const generateBoothCredentials = () => {
        const randomWallet = "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
        setFormData({
            ...formData,
            wallet: randomWallet,
            mobile: "N/A",
            email: "N/A" // Backend will accept this now
        });
    };

    useEffect(() => {
        if (isBoothUser) {
            generateBoothCredentials();
            setJustRegisteredBoothVoter(null);
        } else {
            setFormData({ name: "", wallet: "", mobile: "", email: "", dob: "" });
        }
    }, [isBoothUser]);

    const proceedToBoothWithNewUser = () => {
        if (!justRegisteredBoothVoter) return;
        setFormData({ ...formData, wallet: justRegisteredBoothVoter.wallet });
        setSelectedVoterName(justRegisteredBoothVoter.name);
        setBoothVoter(justRegisteredBoothVoter.wallet);
        setVerifiedFaceDescriptor(new Float32Array(justRegisteredBoothVoter.descriptor));

        // Setup UI
        setActiveTab('booth');
        setBoothMode(true);
        setIsCameraOn(true);
        speak("Booth unlocked for newly registered voter.");
        setJustRegisteredBoothVoter(null);
    };


    const castBoothVote = async (candidateId, candidateName) => {
        if (!boothVoter) return;

        // Display Confirmation Prompt
        setConfirmingVote({ id: candidateId, name: candidateName });
    };

    const executeBoothVote = async () => {
        if (!boothVoter || !confirmingVote) return;

        const candidateId = confirmingVote.id;
        const candidateName = confirmingVote.name;

        // Hide Confirmation
        setConfirmingVote(null);

        // 1. Immediate UI Feedback (Hide Ballot)
        setProcessingVote(true);
        speak(`Casting your vote. Please wait.`);

        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(STATIC_PUBLIC_KEY);
        const encryptedVote = encryptor.encrypt(candidateId.toString());

        try {
            const tx = await contract.boothVote(boothVoter, encryptedVote);
            await tx.wait();

            // 2. Show Success ONLY after confirmation
            setVvpat({ candidate: candidateName, timestamp: new Date().toLocaleTimeString() });
            speak(`Vote cast successfully.`);

            setTimeout(() => {
                setVvpat(null);
                setProcessingVote(false);
                setBoothMode(false);
                setBoothVoter(null);
                setVerifiedFaceDescriptor(null); // Clear session
                setSelectedVoterName(null);
                setFormData({ ...formData, wallet: "" });
                setStatus("Booth reset — ready for next voter");
                speak("Thank you. Processing next voter.");

            }, 5000);
        } catch (e) {
            if (e.code === 'ACTION_REJECTED' || (e.message && e.message.includes('rejected'))) {
                setVoteRejected(true);
                speak("Voting cancelled. You didn't vote yet. Please cast your vote.");
                setProcessingVote(false);
                setTimeout(() => setVoteRejected(false), 5000); // Clear warning after 5s
            } else {
                setStatus("Voting failed: " + e.message);
                setProcessingVote(false);
                setBoothMode(false);
            }
        }
    };

    /* ── Tab config ── */
    const tabs = [
        { id: 'setup', label: 'Setup' },
        { id: 'candidates', label: 'Candidates' },
        { id: 'voters', label: 'Register' },
        { id: 'tally', label: 'Results' },
        { id: 'faucet', label: 'Faucet' },
        { id: 'booth', label: 'Booth' },
    ];

    /* ── Status Classes ── */
    const statusClass = status.includes("failed") || status.includes("error") || status.includes("Error")
        ? "status-error" : status.includes("success") || status.includes("complete") || status.includes("Verified")
            ? "status-success" : "status-info";

    /* ══════════════ RENDER ══════════════ */
    return (
        <div className="glass-card p-4 md:p-6 animate-fade-in relative min-h-[500px]">
            {/* Owner Warning Banner */}
            {contractOwner && account && contractOwner.toLowerCase() !== account.toLowerCase() && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-4 animate-pulse">
                    <div className="text-3xl">⚠️</div>
                    <div>
                        <h3 className="font-bold text-red-400 text-lg">Access Denied</h3>
                        <p className="text-xs text-red-300 mt-1 font-semibold">
                            You are not the authorized contract owner. Please switch to the correct Admin account in MetaMask to perform Admin actions.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Tabs Navigation ── */}
            <div className="flex justify-center mb-6 lg:mb-8 border-b border-white/10 pb-4 gap-2 sm:gap-4 md:gap-8 flex-wrap overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === t.id
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Status Bar ── */}
            {status && (
                <div className={`${statusClass} mb-4 px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse-once`}>
                    {loading && <span className="spinner" />}
                    {status}
                </div>
            )}

            {/* ── Content ── */}
            <div className="glass-card p-4 md:p-6 min-h-[350px] relative overflow-y-auto max-h-[65vh] custom-scroll">

                {/* ═══ BOOTH MODE OVERLAY (Privacy Shield) ═══ */}
                {boothMode && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1a0b2e 50%, #0f172a 100%)' }}>

                        {/* Live Monitor PIP */}
                        <div className={`absolute top-8 right-8 w-32 h-32 rounded-full border-4 ${faceViolation ? 'border-red-600 animate-pulse' : 'border-green-500/60 transition-colors duration-300'} overflow-hidden shadow-2xl z-50 bg-black`}>
                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                            <div className={`absolute bottom-2 left-0 right-0 text-[10px] text-white text-center font-bold flex items-center justify-center gap-1 py-0.5 ${faceViolation ? 'bg-red-700' : 'bg-green-600/80'}`}>
                                <span className={`w-2 h-2 rounded-full bg-white ${!faceViolation && 'animate-pulse'}`} /> LIVE
                            </div>
                        </div>

                        {/* VIOLATION WARNING OVERLAY */}
                        {faceViolation && (
                            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-8 py-4 rounded-xl flex flex-col items-center gap-2 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-bounce border-2 border-red-400">
                                <div className="text-3xl">⚠️</div>
                                <div className="text-xl font-bold">{faceViolation === 'multiple' ? 'MULTIPLE FACES DETECTED' : 'PLEASE LOOK AT THE CAMERA'}</div>
                                <div className="text-sm">Voting disabled until resolved!</div>
                            </div>
                        )}

                        {/* VOTE REJECTED WARNING OVERLAY */}
                        {voteRejected && (
                            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-8 py-4 rounded-xl flex flex-col items-center gap-2 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-bounce border-2 border-red-400">
                                <div className="text-3xl">❌</div>
                                <div className="text-xl font-bold">VOTE CANCELLED</div>
                                <div className="text-sm">Your vote was NOT casted! Please try again.</div>
                            </div>
                        )}

                        {vvpat ? (
                            /* ── VVPAT Receipt ── */
                            <div className="glass-card p-10 max-w-md text-center animate-fade-in border-2 border-green-500/30">
                                <div className="border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Vote Receipt</h2>
                                    <p className="text-xs text-gray-400 mt-1">Verifiable Voter Audit Trail</p>
                                </div>
                                <div className="text-left space-y-4 mb-8 text-gray-300">
                                    <p><span className="text-gray-500">Candidate:</span> <strong className="text-white">SECRET BALLOT</strong></p>
                                    <p><span className="text-gray-500">Time:</span> <strong>{vvpat.timestamp}</strong></p>
                                    <p><span className="text-gray-500">Device:</span> <strong>BOOTH-01</strong></p>
                                </div>
                                <div className="flex justify-center mb-2"><CheckCircleIcon /></div>
                                <p className="text-sm text-gray-500">Printing… Verified.</p>
                            </div>
                        ) : confirmingVote ? (
                            /* ── Vote Confirmation Dialog ── */
                            <div className={`glass-card p-10 max-w-md text-center animate-fade-in border-2 border-yellow-500/30 bg-yellow-500/10 ${faceViolation ? 'opacity-50 grayscale pointer-events-none' : 'transition-opacity'}`}>
                                <h2 className="text-2xl font-bold uppercase text-white mb-2">Confirm Vote</h2>
                                <p className="text-gray-300 mb-8">Are you sure you want to vote for <strong>{confirmingVote.name}</strong>?</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setConfirmingVote(null)}
                                        disabled={processingVote || faceViolation}
                                        className="btn-danger w-full !py-3"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeBoothVote}
                                        disabled={processingVote || faceViolation}
                                        className="btn-primary w-full !py-3 bg-green-600 hover:bg-green-700 shadow-green-500/20"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Ballot Screen ── */
                            <div className={`w-full max-w-4xl animate-fade-in ${faceViolation ? 'opacity-40 grayscale pointer-events-none transition-all duration-300' : 'transition-all'}`}>
                                <h1 className="text-4xl font-bold text-center text-white mb-3">Select Your Candidate</h1>
                                <p className="text-center text-gray-500 mb-12">మీ అభ్యర్థిని ఎంచుకోండి</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {candidates.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => castBoothVote(c.id, c.name)}
                                            disabled={faceViolation}
                                            className="glass-card glass-card-hover p-8 flex items-center justify-between group cursor-pointer border-2 border-purple-500/20 hover:border-purple-500/50"
                                        >
                                            <span className="text-2xl font-bold text-white">{c.name}</span>
                                            <span className="text-sm font-semibold text-purple-400 bg-purple-500/10 px-4 py-2 rounded-full group-hover:bg-purple-500/20 transition">Select</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-12 text-center text-gray-600 text-xs tracking-widest uppercase">
                                    Secure · Secret · Untraceable
                                </div>
                            </div>
                        )}

                        {/* ── Processing Screen (Privacy Shield) ── */
                            processingVote && !vvpat && (
                                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center glass-card bg-black/90">
                                    <div className="spinner w-16 h-16 border-4 border-purple-500 border-t-transparent mb-6"></div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Processing Vote...</h2>
                                    <p className="text-gray-400">Please wait for Admin confirmation.</p>
                                    <p className="text-gray-500 text-xs mt-8">Do not close this window.</p>
                                </div>
                            )}
                    </div>
                )}

                {/* ═══ 1. SETUP TAB ═══ */}
                {activeTab === 'setup' && (
                    <div className="space-y-6 max-w-xl mx-auto animate-fade-in">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Election Setup</h2>
                            <p className="text-gray-400 text-sm">Generate RSA keys and define the election schedule.</p>
                        </div>

                        {/* Election Dates */}
                        <div className="glass-card p-6 border-blue-500/20 border">
                            <h3 className="font-bold text-blue-400 mb-4 text-sm">Define Voting Dates</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</label>
                                    <input type="date" className="input-glass w-full" value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setDatesSaved(false); }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">End Date</label>
                                    <input type="date" className="input-glass w-full" value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setDatesSaved(false); }} />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={saveDates} disabled={loading || datesSaved} className={datesSaved ? 'btn-ghost flex-1 cursor-default' : 'btn-success flex-1'}>
                                    {datesSaved ? 'Dates Saved' : loading ? <><span className="spinner mr-2" /> Saving…</> : 'Define Dates'}
                                </button>
                                {datesSaved && (
                                    <button onClick={resetDates} disabled={loading} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 rounded-lg text-sm font-semibold transition">
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Encryption Keys */}
                        <div className="text-center">
                            <button onClick={generateKeys} disabled={loading} className="btn-primary text-lg !py-4 !px-10">
                                {loading ? <><span className="spinner mr-2" /> Generating…</> : 'Generate & Split Keys (3-of-5)'}
                            </button>
                        </div>
                        {privateKeyShares.length > 0 && (
                            <div className="glass-card p-6 text-left border-yellow-500/30 border">
                                <h3 className="text-yellow-400 font-bold mb-2">Decentralized Key Shares — Distribute These!</h3>
                                <p className="text-xs text-gray-400 mb-6">
                                    The master private key has been destroyed. Give one share to 5 different officials.
                                    <strong> At least 3 of these 5 shares are required to tally the votes!</strong>
                                </p>
                                <div className="space-y-4">
                                    {privateKeyShares.map((share, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-purple-300">Share {idx + 1}</label>
                                                <button onClick={async (e) => {
                                                    try {
                                                        // Fallback structure to avoid document focus errors
                                                        if (navigator.clipboard && window.isSecureContext) {
                                                            await navigator.clipboard.writeText(share);
                                                        } else {
                                                            const ta = document.createElement('textarea');
                                                            ta.value = share;
                                                            ta.setAttribute('readonly', '');
                                                            ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
                                                            document.body.appendChild(ta);
                                                            ta.focus(); ta.select();
                                                            document.execCommand('copy');
                                                            document.body.removeChild(ta);
                                                        }
                                                    } catch (err) {
                                                        console.warn("Clipboard access denied. Please select and copy the text manually.");
                                                    }
                                                    setCopiedIndex(idx); setTimeout(() => setCopiedIndex(-1), 2000);
                                                }} className={`text-[10px] uppercase tracking-wider transition-colors ${copiedIndex === idx ? 'text-green-400 font-bold' : 'text-gray-500 hover:text-white'}`}>
                                                    {copiedIndex === idx ? '✓ Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <input readOnly value={share} className="w-full input-glass text-xs font-mono py-2 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ 2. CANDIDATES TAB ═══ */}
                {activeTab === 'candidates' && (
                    <div className="space-y-6 max-w-xl mx-auto animate-fade-in">
                        <h2 className="text-2xl font-bold text-white text-center">Manage Candidates</h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    className="input-glass"
                                    placeholder="Candidate Name"
                                    value={newCandidate}
                                    onChange={(e) => setNewCandidate(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCandidate()}
                                />
                                <input
                                    className="input-glass"
                                    placeholder="Party"
                                    value={partyName}
                                    onChange={(e) => setPartyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCandidate()}
                                />
                            </div>
                            <button onClick={addCandidate} disabled={loading} className="btn-success w-full !py-2.5">
                                {loading ? <span className="spinner" /> : 'Add Candidate'}
                            </button>
                        </div>
                        <div className="border-t border-white/10 pt-5 mt-5">
                            <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">Danger Zone</p>
                            <button onClick={resetCandidates} className="btn-danger w-full text-sm">
                                Reset All Candidates
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ 3. VOTERS TAB ═══ */}
                {activeTab === 'voters' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-5">
                            <h2 className="text-2xl font-bold text-white">Register Voter</h2>

                            {/* Booth User Toggle */}
                            <label className="flex items-center gap-3 glass p-4 rounded-lg cursor-pointer border border-purple-500/30 hover:bg-purple-500/10 transition">
                                <input
                                    type="checkbox"
                                    checked={isBoothUser}
                                    onChange={(e) => setIsBoothUser(e.target.checked)}
                                    className="w-5 h-5 accent-purple-500"
                                />
                                <div>
                                    <div className="font-bold text-white">Booth Mode User</div>
                                    <div className="text-xs text-gray-400">Auto-generate Wallet ID. No Mobile/Email required.</div>
                                </div>
                            </label>

                            <div className="space-y-3">
                                <input className="input-glass w-full" placeholder="Full Name" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

                                <div className={`transition-all duration-300`}>
                                    <input className="input-glass w-full font-mono mb-3" placeholder="Wallet Address (0x…)" value={formData.wallet}
                                        onChange={(e) => setFormData({ ...formData, wallet: e.target.value })} readOnly={isBoothUser} />

                                    {!isBoothUser && (
                                        <>
                                            <div className="flex gap-3 mb-3">
                                                <input className="input-glass flex-1" placeholder="Mobile Number" value={formData.mobile}
                                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                                            </div>
                                            <input className="input-glass w-full mb-3" placeholder="Email Address" value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        </>
                                    )}
                                </div>

                                {/* DOB moved outside to be editable in Booth Mode */}
                                <div className="flex gap-3 items-center">
                                    <label className="text-xs text-gray-400 font-semibold uppercase">Date of Birth:</label>
                                    <input className="input-glass w-40 text-center [color-scheme:dark]" placeholder="DOB" type="date" value={formData.dob || ''}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                                </div>

                                <button onClick={captureAndRegister} disabled={loading} className="btn-primary w-full !py-3">
                                    {loading ? <><span className="spinner mr-2" /> Registering…</> : 'Capture Face & Register'}
                                </button>

                                {justRegisteredBoothVoter && (
                                    <button onClick={proceedToBoothWithNewUser} className="btn-success w-full !py-3 mt-2 animate-pulse shadow-lg shadow-green-500/20">
                                        🚀 Proceed Immediately to Voting Booth
                                    </button>
                                )}
                            </div>
                            <div className="border-t border-white/10 pt-5">
                                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">Danger Zone</p>
                                <button onClick={resetVoters} className="btn-danger w-full text-sm">
                                    Reset All Voters
                                </button>
                            </div>
                        </div>
                        {/* Camera */}
                        <div className="flex flex-col items-center justify-center rounded-2xl p-4 min-h-[300px] relative self-start w-full mx-auto lg:mt-[10%]" style={{ background: 'rgba(0,0,0,0.4)' }}>
                            {capturedImage ? (
                                <div className="relative w-full">
                                    <img src={capturedImage} alt="Captured Face" className="rounded-xl w-full" />
                                    <button onClick={() => { setCapturedImage(null); setStatus(""); }} className="absolute bottom-3 right-3 btn-danger !py-1.5 !px-3 text-xs opacity-80 hover:opacity-100">
                                        Retake
                                    </button>
                                </div>
                            ) : isCameraOn ? (
                                <div className="relative w-full">
                                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-xl w-full" />
                                    <button onClick={() => setIsCameraOn(false)} className="absolute bottom-3 right-3 btn-danger !py-1.5 !px-3 text-xs opacity-80 hover:opacity-100">
                                        Stop
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <div className="mb-4"><CameraIcon /></div>
                                    <button onClick={() => setIsCameraOn(true)} className="btn-ghost">Start Camera</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ 4. TALLY TAB ═══ */}
                {activeTab === 'tally' && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Election Results</h2>
                            <p className="text-gray-400 text-sm">Decentralized Decryption Process</p>
                        </div>
                        <div className="glass-card p-6 border-orange-500/20 border">
                            <h3 className="font-bold text-orange-400 mb-2 text-sm">Reconstruct Private Key</h3>
                            <p className="text-xs text-gray-400 mb-4">Provide at least 3 authorized shares to reconstruct the key and view results.</p>

                            <div className="space-y-3">
                                {[0, 1, 2].map(index => (
                                    <input
                                        key={index}
                                        className="w-full input-glass text-xs font-mono py-3"
                                        placeholder={`Paste Share ${index + 1} here…`}
                                        value={tallyShares[index]}
                                        onChange={(e) => {
                                            const newShares = [...tallyShares];
                                            newShares[index] = e.target.value;
                                            setTallyShares(newShares);
                                        }}
                                    />
                                ))}
                            </div>

                            <button onClick={tallyVotes} disabled={loading} className="mt-5 btn-primary w-full !py-3">
                                {loading ? <><span className="spinner mr-2" /> Decrypting…</> : 'Combine Shares & Tally'}
                            </button>
                        </div>
                        {results.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.map((r, i) => (
                                    <div key={i} className="glass-card glass-card-hover p-6 text-center">
                                        <div className="text-4xl font-bold text-white mb-1">{r.count}</div>
                                        <div className="text-gray-400 uppercase tracking-wider text-xs font-semibold">{r.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ 5. FAUCET TAB ═══ */}
                {activeTab === 'faucet' && (
                    <div className="space-y-6 max-w-md mx-auto text-center animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Sepolia Testnet Faucet</h2>
                        <p className="text-gray-400 text-sm">Get Sepolia ETH for gas fees. Limited supply — use sparingly.</p>
                        <div className="glass-card p-6 border-blue-500/20 border">
                            <input
                                className="input-glass w-full text-center font-mono mb-4"
                                placeholder="Wallet Address (0x…)"
                                value={formData.wallet}
                                onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                            />
                            <button
                                onClick={async () => {
                                    if (!formData.wallet) { setStatus("Enter an address"); return; }
                                    setStatus("Requesting Sepolia ETH…"); setLoading(true);
                                    try {
                                        const res = await fetch(`${backendUrl}/admin/faucet`, {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ wallet_address: formData.wallet })
                                        });
                                        const data = await res.json();
                                        setStatus(res.ok ? data.message : "Error: " + data.error);
                                    } catch (e) { setStatus("Request failed: " + e.message); }
                                    setLoading(false);
                                }}
                                disabled={loading}
                                className="btn-success w-full"
                            >
                                {loading ? <><span className="spinner mr-2" /> Sending…</> : 'Get 0.01 Sepolia ETH'}
                            </button>
                            <a href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" target="_blank" rel="noopener noreferrer"
                                className="block mt-3 text-xs text-purple-400 hover:text-purple-300 underline"
                            >
                                Need more? Use Google Cloud Sepolia Faucet →
                            </a>
                        </div>
                    </div>
                )}

                {/* ═══ 6. BOOTH TAB ═══ */}
                {activeTab === 'booth' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-5">
                            <div className="border-l-4 border-purple-500 pl-5">
                                <h2 className="text-2xl font-bold text-white">Assisted Voting</h2>
                                <p className="text-gray-400 text-sm mt-1">For voters without smartphones. Admin verifies, voter votes privately.</p>
                            </div>

                            {/* Step 1: Voter Lookup */}
                            <div className="glass-card p-5 space-y-4">
                                <h3 className="font-semibold text-purple-400 text-sm flex items-center gap-2">
                                    <span className="step-dot active w-6 h-6 text-xs">1</span> Find & Verify Voter
                                </h3>
                                <VoterLookup
                                    backendUrl={backendUrl}
                                    onSelect={(voter) => {
                                        setFormData({ ...formData, wallet: voter.wallet_address });
                                        setSelectedVoterName(voter.name);
                                    }}
                                />
                                {selectedVoterName && (
                                    <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-2">
                                        <div>
                                            <div className="font-semibold text-white text-sm">{selectedVoterName}</div>
                                            <div className="text-xs text-gray-500 font-mono">{formData.wallet?.slice(0, 12)}…</div>
                                        </div>
                                    </div>
                                )}
                                <button onClick={verifyForBooth} disabled={loading} className="btn-primary w-full">
                                    {loading ? <><span className="spinner mr-2" /> Verifying…</> : 'Verify Identity'}
                                </button>
                            </div>

                            {/* Step 2: Unlock Booth */}
                            {boothVoter && (
                                <div className="glass-card p-5 space-y-4 border-green-500/30 border animate-fade-in">
                                    <h3 className="font-semibold text-green-400 text-sm flex items-center gap-2">
                                        <span className="step-dot done w-6 h-6 text-xs">✓</span> Identity Confirmed
                                    </h3>
                                    <p className="text-sm text-gray-400">Turn the screen to the voter and unlock the booth.</p>
                                    <button
                                        onClick={() => { setBoothMode(true); speak("Booth unlocked. Please select your candidate."); }}
                                        className="btn-success w-full !py-4 text-lg animate-glow"
                                    >
                                        Unlock Privacy Booth
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Camera */}
                        <div className="flex flex-col items-center justify-center rounded-2xl p-4 min-h-[300px] relative" style={{ background: 'rgba(0,0,0,0.4)' }}>
                            {/* Blocked Overlay */}
                            {Date.now() < monitoringBlockedUntil && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/90 rounded-2xl p-4 text-center animate-pulse">
                                    <div className="text-4xl mb-2">⚠️</div>
                                    <h3 className="text-xl font-bold text-white mb-2">BOOTH BLOCKED</h3>
                                    <p className="text-red-200 mb-4">Multiple faces detected.</p>
                                    <div className="text-3xl font-mono font-bold text-white">
                                        {Math.ceil((monitoringBlockedUntil - Date.now()) / 1000)}s
                                    </div>
                                    <button
                                        onClick={() => setMonitoringBlockedUntil(0)}
                                        className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs text-white uppercase tracking-wider"
                                    >
                                        Use Admin Override
                                    </button>
                                </div>
                            )}

                            {capturedImage && !boothMode ? (
                                <div className="relative w-full h-full">
                                    <img src={capturedImage} alt="Captured Face" className="rounded-xl w-full h-full object-cover" />
                                    <button onClick={() => { setCapturedImage(null); setStatus(""); }} className="absolute bottom-3 right-3 btn-danger !py-1.5 !px-3 text-xs opacity-80 hover:opacity-100">
                                        Retake
                                    </button>
                                </div>
                            ) : isCameraOn ? (
                                <div className="relative w-full">
                                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-xl w-full" />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {boothMode && (
                                            <span className="px-2 py-1 bg-red-600/80 rounded text-xs font-bold text-white animate-pulse shadow-lg">
                                                ● LIVE MONITORING
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => setIsCameraOn(false)} className="absolute bottom-3 right-3 btn-danger !py-1.5 !px-3 text-xs opacity-80 hover:opacity-100">
                                        Stop
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <div className="mb-4"><CameraIcon /></div>
                                    <button onClick={() => setIsCameraOn(true)} className="btn-ghost">Start Camera</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

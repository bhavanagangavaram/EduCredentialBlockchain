import { ethers } from 'ethers';

export const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // 1. Check if already connected
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });

            if (accounts.length === 0) {
                // 2. If not, request connection
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                } catch (err) {
                    if (err.code === -32002) {
                        throw new Error("Connection request already pending. Please check your MetaMask extension.");
                    }
                    throw err;
                }
            }

            // 3. Switch Network to Sepolia
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0xaa36a7') { // 11155111 (Sepolia) in hex
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0xaa36a7' }],
                    });
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: '0xaa36a7',
                                    chainName: 'Sepolia Testnet',
                                    rpcUrls: ['https://1rpc.io/sepolia'],
                                    nativeCurrency: {
                                        name: 'Sepolia ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                                },
                            ],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            return { provider, signer, address: await signer.getAddress() };
        } catch (error) {
            console.error("Connection error", error);
            throw new Error(error.message || "User rejected request");
        }
    } else {
        throw new Error("Metamask not found");
    }
};

export const getContract = (address, abi, signer) => {
    return new ethers.Contract(address, abi, signer);
};

const { ethers } = require("hardhat");

async function main() {
    // Hardhat automatically injects the 20 test accounts
    const signers = await ethers.getSigners();

    // Hardhat test mnemonic
    const mnemonic = "test test test test test test test test test test test junk";

    // Using ethers v6
    for (let i = 0; i < 20; i++) {
        const wallet = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic), `m/44'/60'/0'/0/${i}`);
        if (wallet.address.toLowerCase() === "0xdb4a3540d12eab1c21ec7a14cb166ae4852ece62".toLowerCase()) {
            console.log("Found match!");
            console.log("Address: " + wallet.address);
            console.log("Private Key: " + wallet.privateKey);
            return;
        }
    }
}

main().catch(console.error);

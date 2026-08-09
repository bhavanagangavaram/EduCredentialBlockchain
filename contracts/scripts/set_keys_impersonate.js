import hre from "hardhat";

const STATIC_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApT4TlNveCsFMKBV1muSC
EQdyEakqir7xALMGr8oTPP6/hAdr2qxdLQP4mCvzAXhk2ROsL2oCLXXcNgAlXh2B
urMm9s4JBtLev1jYsVEcwltjvD2OWdRAArFsIu1wbw6pYDjUeXflkKqvvhgRrfHi
TrJomsbrQf1F+YkNX8GNYisRyr/NQjPTsgzb3zNt3izTbj3q8F0FKNyu+NmpmH+O
QwPUYCdxyZKDnzzzM6YiHF4QyX6i1B+QGx8Zjs//zf+HfMRXuCBFlAT3mNeMso6p
bUe7vTeTE8+yt2zg8sP5aR6OQj4lC3lrQLUPW0JJatO30KrDSWkIlwh+0GmTMu7c
QwIDAQAB
-----END PUBLIC KEY-----`;

async function main() {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const OWNER_ADDRESS = "0x6d2bf180b54a3BeF95A2B871aa1a4217775e4070";

    console.log(`Setting election keys for contract at ${CONTRACT_ADDRESS}...`);

    // 1. Impersonate the Owner
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [OWNER_ADDRESS],
    });

    const signer = await hre.ethers.getSigner(OWNER_ADDRESS);

    // 2. Fund the owner if necessary (Impersonated accounts might have 0 ETH)
    const balance = await hre.ethers.provider.getBalance(OWNER_ADDRESS);
    if (balance < hre.ethers.parseEther("1.0")) {
        console.log("Funding owner account...");
        const [funder] = await hre.ethers.getSigners();
        await funder.sendTransaction({
            to: OWNER_ADDRESS,
            value: hre.ethers.parseEther("5.0"),
        });
    }

    // 3. Set the Key
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(CONTRACT_ADDRESS).connect(signer);

    const tx = await voting.setElectionPublicKey(STATIC_PUBLIC_KEY);
    await tx.wait();

    console.log("✅ Election Public Key Set Successfully!");

    // Stop impersonating
    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [OWNER_ADDRESS],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

const { ethers } = require("ethers");

async function main() {
    const signature = "getVoterFaceHash(address)";
    const selector = ethers.id(signature).slice(0, 10);
    console.log(`Selector for ${signature}: ${selector}`);

    // Check if it matches 0x06a49fce
    if (selector === "0x06a49fce") {
        console.log("MATCH CONFIRMED: 0x06a49fce is getVoterFaceHash(address)");
    } else {
        console.log("NO MATCH.");
    }

    // Check contract code
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const code = await provider.getCode(address);
    console.log(`Code at ${address}: ${code.slice(0, 20)}...`);
    if (code === "0x") {
        console.log("ERROR: No code at contract address! Hardhat likely restarted.");
    } else {
        console.log("OK: Contract code exists.");
    }
}

main();

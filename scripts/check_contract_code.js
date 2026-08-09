const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const code = await provider.getCode(address);
    console.log(`Code at ${address}: ${code.slice(0, 50)}...`);

    if (code === "0x") {
        console.error("ERROR: No code found at contract address!");
    } else {
        console.log("SUCCESS: Contract code exists.");
    }
}

main().catch(console.error);

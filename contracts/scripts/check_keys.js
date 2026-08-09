import hre from "hardhat";

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    console.log(`Checking election keys on contract: ${contractAddress}`);

    try {
        const key = await voting.electionPublicKey();
        console.log(`Election Public Key: ${key}`);

        if (!key || key === "") {
            console.log("⚠️ Election Public Key is NOT set!");
        } else {
            console.log("✅ Election Public Key is set.");
        }
    } catch (e) {
        console.error("Error fetching election key:", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

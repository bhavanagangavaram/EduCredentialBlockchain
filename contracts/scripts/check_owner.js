import hre from "hardhat";

async function main() {
    // Default address if env var not picked up (Hardhat scripts don't auto-read .env without dotenv, but we can hardcode for local debug)
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    const owner = await voting.owner();
    console.log(`Current Contract Owner: ${owner}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

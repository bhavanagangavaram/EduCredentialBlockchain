import hre from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(CONTRACT_ADDRESS);

    console.log(`Reading candidates from ${CONTRACT_ADDRESS}...`);

    // Assuming getAllCandidates or getCandidates exists. 
    // Based on previous UserMode.js: const cands = await contract.getCandidates();
    const candidates = await voting.getCandidates();

    if (candidates.length === 0) {
        console.log("No candidates found.");
    } else {
        console.log(`Found ${candidates.length} candidates:`);
        candidates.forEach((c, i) => {
            console.log(`${i + 1}. [ID: ${c.id}] ${c.name} (Votes: ${c.voteCount})`);
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

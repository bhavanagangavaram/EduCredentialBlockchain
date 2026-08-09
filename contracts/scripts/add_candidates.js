import hre from "hardhat";

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    const candidates = ["YSR", "CBN"];

    console.log(`Adding candidates to ${contractAddress}...`);

    for (const name of candidates) {
        try {
            console.log(`Adding ${name}...`);
            const tx = await voting.addCandidate(name);
            await tx.wait();
            console.log(`✅ Successfully added ${name}`);
        } catch (e) {
            console.error(`❌ Failed to add ${name}:`, e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

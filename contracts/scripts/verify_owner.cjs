const hre = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    try {
        const owner = await voting.owner();
        console.log(`Contract Owner:   ${owner}`);

        if (deployer.address === owner) {
            console.log("✅ SUCCESS: Deployer is the Owner.");
        } else {
            console.log("❌ FAILURE: Deployer is NOT the Owner.");
        }
    } catch (e) {
        console.log("❌ Error fetching owner:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

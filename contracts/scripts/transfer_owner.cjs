const hre = require("hardhat");

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const newOwner = "0x6d2bf180b54a3BeF95A2B871aa1a4217775e4070";

    const voting = await Voting.attach(contractAddress);
    const [deployer] = await hre.ethers.getSigners();

    console.log(`Transferring ownership from ${deployer.address} to ${newOwner}...`);

    try {
        const tx = await voting.transferOwnership(newOwner);
        await tx.wait();
        console.log("Ownership transferred successfully!");
    } catch (err) {
        console.error("Transfer failed:", err.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

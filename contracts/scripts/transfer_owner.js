import hre from "hardhat";

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    // The user's specific address that is getting the "Only owner" error
    const newOwner = "0x6d2bf180b54a3BeF95A2B871aa1a4217775e4070";

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    const currentOwner = await voting.owner();
    console.log(`Current Owner: ${currentOwner}`);

    if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
        console.log("Ownership already matches!");
        return;
    }

    console.log(`Transferring ownership to: ${newOwner}`);
    const tx = await voting.transferOwnership(newOwner);
    await tx.wait();

    console.log(`Ownership successfully transferred to ${newOwner}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

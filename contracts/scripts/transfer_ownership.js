import { ethers } from "hardhat";

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const newOwnerAddress = "0xDb4a3540D12eaB1C21ec7a14Cb166AE4852eCe62";

    const accounts = await ethers.getSigners();
    const currentOwner = accounts[0];

    console.log(`Current Owner Address: ${currentOwner.address}`);

    const Voting = await ethers.getContractFactory("Voting");
    const votingContract = Voting.attach(contractAddress);

    // Verify current owner
    const ownerOnChain = await votingContract.owner();
    console.log(`Owner registered on the contract: ${ownerOnChain}`);

    if (ownerOnChain.toLowerCase() !== currentOwner.address.toLowerCase()) {
        console.error("The account executing this script is not the current contract owner! Transfer will fail.");
        return;
    }

    console.log(`Transferring ownership to: ${newOwnerAddress}...`);

    const tx = await votingContract.connect(currentOwner).transferOwnership(newOwnerAddress);
    await tx.wait();

    console.log(`Ownership successfully transferred!`);

    const updatedOwner = await votingContract.owner();
    console.log(`New Contract Owner: ${updatedOwner}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import hre from "hardhat";

async function main() {
    const address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(address);

    console.log(`Checking contract at ${address}`);

    // 1. Check Code
    const code = await hre.ethers.provider.getCode(address);
    console.log(`Code length: ${code.length}`);
    if (code === "0x") {
        console.error("CRITICAL: No code at address!");
        return;
    }

    const [owner] = await hre.ethers.getSigners();
    const targetAddress = owner.address; // Check Account 0

    console.log(`Checking status for: ${targetAddress}`);

    // 2. Check View functionality
    console.log("Checking status via View...");
    let status = await voting.voters(targetAddress);
    console.log(`[View] isRegistered: ${status.isRegistered}`);

    // 3. Attempt Write functionality
    console.log("Attempting to Register via Transaction...");
    try {
        const tx = await voting.connect(owner).registerVoter(targetAddress);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log("Transaction Mined: SUCCESS. (User was NOT registered before)");
    } catch (error) {
        console.log("Transaction Failed/Reverted.");
        if (error.message.includes("Voter already registered")) {
            console.log("Revert Reason: 'Voter already registered'. (User WAS registered before)");
        } else {
            console.log(`Revert Error: ${error.message}`);
        }
    }

    // 4. Check View again
    status = await voting.voters(voter.address);
    console.log(`[View Again] isRegistered: ${status.isRegistered}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

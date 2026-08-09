import hre from "hardhat";

async function main() {
    const votingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    console.log(`Checking Contract at: ${votingAddress}`);

    try {
        const Voting = await hre.ethers.getContractFactory("Voting");
        const voting = Voting.attach(votingAddress);

        // Attempt to call owner function
        try {
            const owner = await voting.owner();
            console.log(`Contract Owner: ${owner}`);

            const accounts = await hre.ethers.getSigners();
            console.log("Local Accounts:");
            for (let i = 0; i < 5; i++) {
                console.log(`Account ${i}: ${accounts[i].address}`);
                if (accounts[i].address === owner) {
                    console.log(`*** MATCH FOUND: Owner is Account ${i} ***`);
                }
            }
        } catch (callError) {
            console.error("Failed to call owner():", callError.message);
            // It's possible the contract doesn't exist at this address on this network
            const code = await hre.ethers.provider.getCode(votingAddress);
            if (code === "0x") {
                console.error("ERROR: No contract found at this address on localhost!");
            }
        }

    } catch (e) {
        console.error("Error connecting to contract:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import hre from "hardhat";

async function main() {
    const address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"; // Current deployment
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(address);

    const filter = voting.filters.VoterRegistered();
    const events = await voting.queryFilter(filter);
    console.log(`Found ${events.length} registration events.`);

    for (const event of events) {
        console.log(`Registered Voter: ${event.args[0]}`);
        const status = await voting.voters(event.args[0]);
        console.log(`  Current Status - isRegistered: ${status.isRegistered}, hasVoted: ${status.hasVoted}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

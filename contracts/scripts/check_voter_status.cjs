const hre = require("hardhat");

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const voting = await Voting.attach(contractAddress);

    const voterAddress = "0x4005ba25Da01283a7f88f2274Db0fdada8fEF9f6";

    console.log(`Checking status for ${voterAddress}...`);

    const voter = await voting.voters(voterAddress);
    console.log(`Is Registered: ${voter.isRegistered}`);
    console.log(`Has Voted: ${voter.hasVoted}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

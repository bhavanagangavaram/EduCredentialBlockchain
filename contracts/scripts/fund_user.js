import hre from "hardhat";

async function main() {
    // Address observed in user's screenshot/logs
    const userAddress = "0x24610453B421063A7D79F8FdcB8C09082C0499a5";

    console.log(`Funding user ${userAddress}...`);

    const [funder] = await hre.ethers.getSigners();
    console.log(`Funder: ${funder.address} (Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(funder.address))} ETH)`);

    const tx = await funder.sendTransaction({
        to: userAddress,
        value: hre.ethers.parseEther("100.0"), // Send 100 ETH to be safe
    });

    await tx.wait();
    console.log(`✅ Sent 100 ETH to ${userAddress}`);
    console.log(`New Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(userAddress))} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

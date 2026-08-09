const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const adminAddress = "0x6d2bf180b54a3BeF95A2B871aa1a4217775e4070";

    console.log(`Sending 100 ETH from ${deployer.address} to ${adminAddress}...`);

    const tx = await deployer.sendTransaction({
        to: adminAddress,
        value: hre.ethers.parseEther("100.0")
    });

    await tx.wait();

    const balance = await hre.ethers.provider.getBalance(adminAddress);
    console.log(`Transaction successful! New Balance: ${hre.ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

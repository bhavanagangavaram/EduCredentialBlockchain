import hre from "hardhat";

async function main() {
    const address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
    console.log(`Checking code at address: ${address}`);
    try {
        // Explicitly use the localhost provider URL if needed, but hardhat runtime should handle it
        const code = await hre.ethers.provider.getCode(address);
        console.log(`Code length: ${code.length}`);
        if (code === "0x") {
            console.log("RESULT: NO_CODE");
        } else {
            console.log("RESULT: CODE_EXISTS");
        }
    } catch (e) {
        console.error("Error connecting to provider:", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

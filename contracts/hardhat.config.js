import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            chainId: 31337
        },
        sepolia: {
            url: "https://1rpc.io/sepolia",
            accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`.replace('0x0x', '0x')] : []
        }
    },
    paths: {
        artifacts: "./artifacts",
        cache: "./cache",
        sources: "./contracts",
        tests: "./test",
    },
};

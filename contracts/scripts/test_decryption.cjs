const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function getStaticPrivateKey() {
    return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQClPhOU294KwUwo
FXWa5IIRB3IRqSqKvvEAswavyhM8/r+EB2varF0tA/iYK/MBeGTZE6wvagItddw2
ACVeHYG6syb2zgkG0t6/WNixURzCW2O8PY5Z1EACsWwi7XBvDqlgONR5d+WQqq++
GBGt8eJOsmiaxutQf1F+YkNX8GNYisRyr/NQjPTsgzb3zNt3izTbj3q8F0FKNyu+
NmpmH+OQwPUYCdxyZKDnzzzM6YiHF4QyX6i1B+QGx8Zjs//zf+HfMRXuCBFlAT3m
NeMso6pbUe7vTeTE8+yt2zg8sP5aR6OQj4lC3lrQLUPW0JJatO30KrDSWkIlwh+0
GmTMu7cQwIDAQABAoIBAQApNYn8nbmIpGGpAEigfO5QEKMlBlN87SP5hFDW3Zn2Kex
XRPxX4LblFDpEOO8lNzivL4DQDmFxTvR7PP5YHLKgc9loIGcAnbnOFrbt8Js3plA
EJ5t35/iFcjmCw9usR3i5YLljGUzRN+/cUSi5YttJqbs6ql4RXb7A+HNmajBndsj
67Q4pApETQtVWhC4m0c+VAdLt3qAMjKDwL0q9VKBWAkCz8OVT9jKxTg9UATlMeGr
TrcDmx5BLmSYxEcfb+dBURp1i6yEnKwe72bU4r/9CGC3KbhDnT1upxgAhQsv5WzZ
C7lQD379KqZbf9giHHbQGKyH+cQn2MQeub6YegnfYQKBgQDSSBQnwXz6cbP7WQkt
Jr7wKPgDD4mPN2MqRkS57N3tGgBA63RQyUrQUH/rkoP+74EMRWPIWdSyzR7Dv4DM
TLJ1fyyAKGpXMeCxFY5kPbVK1c5T0A4pzYsSZRLd5qV2X3h8yyOAfWiDWQtCNZ2l
V17p79UDm+z8ycMp4avD3cUYywKBgQDJKzK0ZdeIOLn23b/TcyWcZJ+D9f01Pd3k
Ojr8S64+YqHo3a5s2M1c+JcHXNQe/dHKea8yDun79s1jadGJhqVVoiJDsSnSPYGn
J1NqRK1GgpBdn8IzbIvOhtBTLXgL9W2Glyjw8N3dZuDtNnUHB76zGE5grVncoQo4
HubFZM3zaQKBgBSk4uWsRzrHIuZQLWhzX1dwjjius9CNnXyu/VxLdtYqMVAuTXMI
8AFXhdd4wOCsXrz3qv4mY41SOez5xglIllSWsaW7UgVRbj+0YBBTRpMcPm9YA6vy
8+5QYfPLCv9+C/QkdU3OAg6zFTngzaNH2peY5g6+phuDK1fXQeeuxATVAoGBAItC
VD99oM60NkgnCfwe4hJ5tdNsHnUU9t5fUSYGXgDh1qOVkoHXM5MAo8x8/nrVyr0X
r6g/msrJ9zSytFM32oyFSKMDqafY3EASgTQ3hpwhFj85sP5YThASU3TBLTFaHQ/m
5HimxW/XIC4WXL0ZJ3JjiR5z4plRAfoHqklLlybBAoGAaPQ2jAWKI5PR58wmXs1R
YyTpMlaUqgszymnFD8LUq/Nbn5Rb/npNhQerxf0YPfqQJdyX62Jlc3IT+b4OlwAf
9RlINlQBDpbaxIEGnJBmjpK43y9zX7OfDVmwmFGokNLCWf9tHfnTm7HFh1+SPpsv
GXqgJaVyJRwb0YkrrMLVWpY=
-----END PRIVATE KEY-----`;
}

async function main() {
    process.env.NODE_OPTIONS = "--no-warnings";
    const NodeRSA = require('node-rsa');

    // Read contract
    const envPath = path.join(__dirname, "../../backend-node/.env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const addressLine = envContent.split("\n").find(line => line.startsWith("CONTRACT_ADDRESS="));
    const contractAddress = addressLine.split("=")[1].trim();

    const Voting = await ethers.getContractFactory("Voting");
    const contract = Voting.attach(contractAddress);
    const filter = contract.filters.VoteCast();
    const logs = await contract.queryFilter(filter, 0, "latest");

    const pk = getStaticPrivateKey();
    const key = new NodeRSA();
    key.importKey(pk, 'pkcs8-private');
    // Set padding to standard RSA PKCS1_V1_5 which JSEncrypt uses
    key.setOptions({ encryptionScheme: 'pkcs1' });

    console.log("Found", logs.length, "votes.");

    let decryptedCount = 0;
    for (const log of logs) {
        try {
            const encrypted = log.args.encryptedVote;
            const decrypted = key.decrypt(encrypted, 'utf8');
            console.log("SUCCESS! Decrypted Candidate ID:", decrypted);
            decryptedCount++;
        } catch (e) {
            console.log("Failed to decrypt a vote:", e.message);
        }
    }
    console.log(`Successfully decrypted ${decryptedCount}/${logs.length} votes.`);
}

main().catch(console.error);

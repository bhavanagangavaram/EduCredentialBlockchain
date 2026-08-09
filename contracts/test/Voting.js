import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("Voting Contract", function () {
    let Voting;
    let voting;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        voting = await ethers.deployContract("Voting");
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await voting.owner()).to.equal(owner.address);
        });

        it("Should start with election open", async function () {
            expect(await voting.isElectionOpen()).to.equal(true);
        });
    });

    describe("Election Setup", function () {
        it("Should allow owner to set election public key", async function () {
            const sampleKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...";
            await voting.setElectionPublicKey(sampleKey);
            expect(await voting.electionPublicKey()).to.equal(sampleKey);
        });

        it("Should allow owner to add candidates", async function () {
            await voting.addCandidate("Party A");
            await voting.addCandidate("Party B");

            const candidates = await voting.getCandidates();
            expect(candidates.length).to.equal(2);
            expect(candidates[0].name).to.equal("Party A");
            expect(candidates[1].name).to.equal("Party B");
        });
    });

    describe("Voter Registration", function () {
        it("Should allow owner to register a voter", async function () {
            const faceHash = ethers.id("face-data-hash");
            await voting.connect(owner).registerVoter(addr1.address, faceHash);

            const voter = await voting.voters(addr1.address);
            expect(voter.isRegistered).to.equal(true);
            expect(voter.faceHash).to.equal(faceHash);
        });

        it("Should not allow duplicates", async function () {
            const faceHash = ethers.id("face-data-hash");
            await voting.connect(owner).registerVoter(addr1.address, faceHash);

            await expect(
                voting.connect(owner).registerVoter(addr1.address, faceHash)
            ).to.be.revertedWith("Voter already registered");
        });
    });

    describe("Voting Process", function () {
        const pubKey = "mock-public-key";

        beforeEach(async function () {
            await voting.setElectionPublicKey(pubKey);
            await voting.addCandidate("Party A");
            await voting.registerVoter(addr1.address, ethers.id("face1"));
        });

        it("Should allow registered voter to cast a vote", async function () {
            const encryptedVote = "encrypted-vote-string-for-party-a";

            await expect(voting.connect(addr1).vote(encryptedVote))
                .to.emit(voting, "VoteCast")
                .withArgs(addr1.address, encryptedVote);

            const voter = await voting.voters(addr1.address);
            expect(voter.hasVoted).to.equal(true);
            expect(voter.encryptedVote).to.equal(encryptedVote);
        });

        it("Should prevent double voting", async function () {
            const encryptedVote = "vote";
            await voting.connect(addr1).vote(encryptedVote);

            await expect(
                voting.connect(addr1).vote(encryptedVote)
            ).to.be.revertedWith("Voter already voted");
        });

        it("Should fail if election key is not set", async function () {
            // redeploy to have clean state without key
            const newVoting = await ethers.deployContract("Voting");
            await newVoting.registerVoter(addr1.address, ethers.id("face"));
            await expect(
                newVoting.connect(addr1).vote("vote")
            ).to.be.revertedWith("Election Key not set");
        });

        it("Should fail if voter is not registered", async function () {
            await expect(
                voting.connect(addr2).vote("vote")
            ).to.be.revertedWith("Voter not registered");
        });
    });
});

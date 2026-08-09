// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        // Vote count is REMOVED from chain for secrecy. Tally is done off-chain.
        // We keep 'voteCount' here just for legacy compatibility if we wanted to display *something*, 
        // but it will effectively be 0 or unused in Secret Mode.
        uint256 voteCount; 
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        string encryptedVote; // Store the RSA string
        bytes32 faceHash;     // SHA-256 Hash of Face Descriptor
    }

    address public owner;
    string public electionPublicKey; // Admin's RSA Public Key
    bool public isElectionOpen = true;

    mapping(address => Voter) public voters;
    Candidate[] public candidates;
    
    event VoterRegistered(address voter, bytes32 faceHash);
    event VoteCast(address voter, string encryptedVote);
    event CandidateAdded(uint256 candidateId, string name);
    event PublicKeySet(string key);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }

    function setElectionPublicKey(string memory _key) external onlyOwner {
        electionPublicKey = _key;
        emit PublicKeySet(_key);
    }

    function addCandidate(string memory _name) external onlyOwner {
        candidates.push(Candidate({
            id: candidates.length,
            name: _name,
            voteCount: 0
        }));
        emit CandidateAdded(candidates.length - 1, _name);
    }

    function resetCandidates() external onlyOwner {
        delete candidates;
    }

    function registerVoter(address _voter, bytes32 _faceHash) external onlyOwner {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter].isRegistered = true;
        voters[_voter].faceHash = _faceHash;
        emit VoterRegistered(_voter, _faceHash);
    }

    function vote(string memory _encryptedVote) external {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        require(!voters[msg.sender].hasVoted, "Voter already voted");
        require(bytes(electionPublicKey).length > 0, "Election Key not set");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].encryptedVote = _encryptedVote;

        emit VoteCast(msg.sender, _encryptedVote);
    }

    // Booth Mode: Admin submits vote ON BEHALF of verified user
    function boothVote(address _voter, string memory _encryptedVote) external onlyOwner {
        require(voters[_voter].isRegistered, "Voter not registered");
        require(!voters[_voter].hasVoted, "Voter already voted");
        require(bytes(electionPublicKey).length > 0, "Election Key not set");

        voters[_voter].hasVoted = true;
        voters[_voter].encryptedVote = _encryptedVote;

        emit VoteCast(_voter, _encryptedVote);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getVoterFaceHash(address _voter) external view returns (bytes32) {
        return voters[_voter].faceHash;
    }
}

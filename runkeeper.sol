contract RunKeeper {

    struct Commitment {
        uint factId;
        bytes32 factHash;
        uint amount;
        address owner;
        address defaultAccount;
        address oracle;
        uint threshold;
    }

    mapping (bytes32 => Commitment) commitments;
    mapping (address => bytes32[]) accountCommitments;

    function makeCommitment(uint factId, bytes32 factHash, address defaultAccount, address oracle, uint threshold) external returns (bytes32 hash) {
        hash = sha3(this, msg.sender, msg.value, msg.data);
        commitments[hash] = Commitment({
            factId: factId,
            factHash: factHash,
            amount: msg.value,
            owner: msg.sender,
            defaultAccount: defaultAccount,
            oracle: oracle,
            threshold: threshold,
        });
        accountCommitments[msg.sender].push(hash);
    }

    function settle(bytes32 hash, bytes32 resultHex, uint8 v, bytes32 r, bytes32 s) external returns (bool) {
        Commitment commitment = commitments[hash];

        bytes32 result_hash = sha3(commitment.factHash, resultHex);
        address signer_address = ecrecover(result_hash, v, r, s);

        if (signer_address != commitment.oracle) {
            throw;
        }

        uint result = uint(resultHex);

        if (result > commitment.threshold) {
            commitment.owner.send(commitment.amount);
            return true;
        }
        else {
            commitment.defaultAccount.send(commitment.amount);
            return false;
        }
    }

    function getMyCommitmentCount() external constant returns (uint) {
        return accountCommitments[msg.sender].length;
    }

    function getMyCommitmentHash(uint i) external constant returns (bytes32) {
        return accountCommitments[msg.sender][i];
    }

    function getCommitment(bytes32 hash) external constant returns (uint factId, bytes32 factHash, uint amount, address owner, address defaultAccount, address oracle, uint threshold) {
        Commitment commitment = commitments[hash];
        factId = commitment.factId;
        factHash = commitment.factHash;
        amount = commitment.amount;
        owner = commitment.owner;
        defaultAccount = commitment.defaultAccount;
        oracle = commitment.oracle;
        threshold = commitment.threshold;
    }

}

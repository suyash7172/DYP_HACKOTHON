// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FraudRegistry
 * @dev Smart contract for logging and verifying fraud records on Ethereum/Polygon
 * @author SecurePay AI Team
 */
contract FraudRegistry {
    
    struct FraudRecord {
        string transactionId;
        bytes32 dataHash;
        uint256 amount;       // in wei (smallest unit)
        uint256 fraudScore;   // 0-10000 (representing 0.00-100.00%)
        string riskLevel;     // low, medium, high, critical
        string location;
        string category;
        uint256 timestamp;
        address reportedBy;
        bool isVerified;
    }
    
    // State variables
    address public owner;
    uint256 public recordCount;
    mapping(uint256 => FraudRecord) public records;
    mapping(string => uint256) public transactionToRecord;
    mapping(string => bool) public transactionExists;
    
    // Events
    event FraudRecorded(
        uint256 indexed recordId,
        string transactionId,
        bytes32 dataHash,
        uint256 amount,
        uint256 fraudScore,
        string riskLevel,
        uint256 timestamp
    );
    
    event RecordVerified(uint256 indexed recordId, address verifier);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        recordCount = 0;
    }
    
    /**
     * @dev Log a new fraud record
     */
    function logFraud(
        string memory _transactionId,
        bytes32 _dataHash,
        uint256 _amount,
        uint256 _fraudScore,
        string memory _riskLevel,
        string memory _location,
        string memory _category
    ) public onlyOwner returns (uint256) {
        require(!transactionExists[_transactionId], "Transaction already recorded");
        require(_fraudScore <= 10000, "Fraud score must be <= 10000");
        
        recordCount++;
        
        records[recordCount] = FraudRecord({
            transactionId: _transactionId,
            dataHash: _dataHash,
            amount: _amount,
            fraudScore: _fraudScore,
            riskLevel: _riskLevel,
            location: _location,
            category: _category,
            timestamp: block.timestamp,
            reportedBy: msg.sender,
            isVerified: false
        });
        
        transactionToRecord[_transactionId] = recordCount;
        transactionExists[_transactionId] = true;
        
        emit FraudRecorded(
            recordCount,
            _transactionId,
            _dataHash,
            _amount,
            _fraudScore,
            _riskLevel,
            block.timestamp
        );
        
        return recordCount;
    }
    
    /**
     * @dev Verify a fraud record
     */
    function verifyRecord(uint256 _recordId) public onlyOwner {
        require(_recordId > 0 && _recordId <= recordCount, "Invalid record ID");
        records[_recordId].isVerified = true;
        emit RecordVerified(_recordId, msg.sender);
    }
    
    /**
     * @dev Get fraud record by ID
     */
    function getRecord(uint256 _recordId) public view returns (
        string memory transactionId,
        bytes32 dataHash,
        uint256 amount,
        uint256 fraudScore,
        string memory riskLevel,
        string memory location,
        string memory category,
        uint256 timestamp,
        address reportedBy,
        bool isVerified
    ) {
        require(_recordId > 0 && _recordId <= recordCount, "Invalid record ID");
        FraudRecord storage record = records[_recordId];
        return (
            record.transactionId,
            record.dataHash,
            record.amount,
            record.fraudScore,
            record.riskLevel,
            record.location,
            record.category,
            record.timestamp,
            record.reportedBy,
            record.isVerified
        );
    }
    
    /**
     * @dev Verify transaction integrity by comparing hashes
     */
    function verifyIntegrity(string memory _transactionId, bytes32 _dataHash) public view returns (bool) {
        require(transactionExists[_transactionId], "Transaction not found");
        uint256 recordId = transactionToRecord[_transactionId];
        return records[recordId].dataHash == _dataHash;
    }
    
    /**
     * @dev Get record ID by transaction ID
     */
    function getRecordByTransaction(string memory _transactionId) public view returns (uint256) {
        require(transactionExists[_transactionId], "Transaction not found");
        return transactionToRecord[_transactionId];
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
    
    /**
     * @dev Get total record count
     */
    function getTotalRecords() public view returns (uint256) {
        return recordCount;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CarbonCredit
 * @dev Government-regulated carbon credit token with transfer rules
 */
contract CarbonCredit {

    // ─── State ───────────────────────────────────────────────────────────────
    address public government;
    string  public constant name   = "CarbonCredit";
    string  public constant symbol = "CCT";

    mapping(address => uint256) private _balances;
    mapping(address => bool)    public  approvedCompanies;
    mapping(address => uint256) public  dailyTraded;
    mapping(address => uint256) public  lastTradeDay;
    mapping(bytes32 => bool)    public  purchaseHistory;   // buyer+seller => traded once

    uint256 public constant MAX_DAILY_LIMIT = 50;
    uint256 public totalSupply;
    uint256 public totalRetired;

    // ─── Events ──────────────────────────────────────────────────────────────
    event CreditsIssued(address indexed to, uint256 amount, string submissionId);
    event CreditsTransferred(address indexed from, address indexed to, uint256 amount, string transactionId);
    event CreditsRetired(address indexed by, uint256 amount);
    event CompanyApproved(address indexed company);
    event CompanyRevoked(address indexed company);

    // ─── Modifiers ───────────────────────────────────────────────────────────
    modifier onlyGovernment() {
        require(msg.sender == government, "Only government can call this");
        _;
    }

    modifier onlyApproved(address addr) {
        require(approvedCompanies[addr], "Company not approved");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor() {
        government = msg.sender;
    }

    // ─── Government Functions ─────────────────────────────────────────────────

    function approveCompany(address company) external onlyGovernment {
        approvedCompanies[company] = true;
        emit CompanyApproved(company);
    }

    function revokeCompany(address company) external onlyGovernment {
        approvedCompanies[company] = false;
        emit CompanyRevoked(company);
    }

    function mintCredits(
        address to,
        uint256 amount,
        string calldata submissionId
    ) external onlyGovernment onlyApproved(to) {
        require(amount > 0, "Amount must be > 0");
        _balances[to] += amount;
        totalSupply    += amount;
        emit CreditsIssued(to, amount, submissionId);
    }

    // ─── Trading Functions ────────────────────────────────────────────────────

    function transferCredits(
        address from,
        address to,
        uint256 amount,
        string calldata transactionId
    ) external onlyGovernment onlyApproved(from) onlyApproved(to) {
        require(amount > 0, "Amount must be > 0");
        require(_balances[from] >= amount, "Insufficient credits");
        require(from != to, "Cannot transfer to yourself");

        // One-time seller rule
        bytes32 pairKey = keccak256(abi.encodePacked(to, from));
        require(!purchaseHistory[pairKey], "Buyer already purchased from this seller");

        // Daily limit check
        _resetDailyIfNeeded(from);
        _resetDailyIfNeeded(to);
        require(dailyTraded[from] + amount <= MAX_DAILY_LIMIT, "Seller daily limit exceeded");
        require(dailyTraded[to]   + amount <= MAX_DAILY_LIMIT, "Buyer daily limit exceeded");

        _balances[from]     -= amount;
        _balances[to]       += amount;
        dailyTraded[from]   += amount;
        dailyTraded[to]     += amount;
        purchaseHistory[pairKey] = true;

        emit CreditsTransferred(from, to, amount, transactionId);
    }

    function retireCredits(address from, uint256 amount) external onlyGovernment onlyApproved(from) {
        require(amount > 0, "Amount must be > 0");
        require(_balances[from] >= amount, "Insufficient credits");
        _balances[from] -= amount;
        totalSupply     -= amount;
        totalRetired    += amount;
        emit CreditsRetired(from, amount);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function hasTraded(address buyer, address seller) external view returns (bool) {
        bytes32 pairKey = keccak256(abi.encodePacked(buyer, seller));
        return purchaseHistory[pairKey];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _resetDailyIfNeeded(address addr) internal {
        uint256 today = block.timestamp / 86400;
        if (lastTradeDay[addr] < today) {
            dailyTraded[addr]  = 0;
            lastTradeDay[addr] = today;
        }
    }
}

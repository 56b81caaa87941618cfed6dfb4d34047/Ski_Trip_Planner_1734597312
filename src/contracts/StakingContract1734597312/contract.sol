
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract StakingContract1734597312 is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate; // Reward amount per second per token
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewards;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor() Ownable() {
        // Initialize with placeholder addresses. These should be changed before deployment.
        stakingToken = IERC20(address(0x1234567890123456789012345678901234567890));
        rewardToken = IERC20(address(0x0987654321098765432109876543210987654321));
        rewardRate = 1e15; // 0.001 tokens per second per staked token
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        updateReward(msg.sender);
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0");
        require(stakedBalance[msg.sender] >= amount, "Not enough staked");
        updateReward(msg.sender);
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external {
        updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardsClaimed(msg.sender, reward);
        }
    }

    function updateReward(address account) internal {
        rewards[account] += earned(account);
        lastUpdateTime[account] = block.timestamp;
    }

    function earned(address account) public view returns (uint256) {
        return (stakedBalance[account] * (block.timestamp - lastUpdateTime[account]) * rewardRate) / 1e18;
    }

    function getStakedBalance(address account) external view returns (uint256) {
        return stakedBalance[account];
    }

    function getPendingRewards(address account) external view returns (uint256) {
        return rewards[account] + earned(account);
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }

    function withdrawUnusedRewards() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(balance > 0, "No rewards to withdraw");
        rewardToken.safeTransfer(owner(), balance);
    }
}

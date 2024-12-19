
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract ComplexGasHeavyContract1734597312 is Ownable {
    struct UserData {
        uint256 id;
        string name;
        uint256 score;
    }

    UserData[] public users;
    mapping(address => uint256) public userBalances;

    event UserAdded(uint256 indexed id, string name, uint256 score);
    event BalanceUpdated(address indexed user, uint256 newBalance);
    event ComplexOperationPerformed(uint256 result);

    constructor() Ownable() {}

    function addMultipleUsers(UserData[] memory _users) external onlyOwner {
        for (uint256 i = 0; i < _users.length; i++) {
            users.push(_users[i]);
            emit UserAdded(_users[i].id, _users[i].name, _users[i].score);
        }
    }

    function performComplexCalculation() external {
        uint256 result = 0;
        for (uint256 i = 0; i < users.length; i++) {
            result += Math.sqrt(users[i].score) * users[i].id;
        }
        emit ComplexOperationPerformed(result);
    }

    function updateAllBalances(uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            address userAddress = address(uint160(users[i].id));
            userBalances[userAddress] += amount;
            emit BalanceUpdated(userAddress, userBalances[userAddress]);
        }
    }

    function simulateExternalCall(address[] memory _addresses) external {
        for (uint256 i = 0; i < _addresses.length; i++) {
            (bool success, ) = _addresses[i].call(abi.encodeWithSignature("ping()"));
            require(success, "External call failed");
        }
    }

    function processLargeArray(uint256[] memory data) external pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < data.length; i++) {
            sum += Math.sqrt(data[i]);
        }
        return sum;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}

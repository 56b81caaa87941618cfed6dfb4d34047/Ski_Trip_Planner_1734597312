
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintingContract1734597312 is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1 million tokens with 18 decimals

    constructor() ERC20("MintingToken", "MTK") Ownable() {
        // Mint initial supply to the contract deployer
        _mint(msg.sender, 100000 * 10**18); // 100,000 tokens initial supply
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Minting would exceed max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Override the decimals function to specify 18 decimals
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}

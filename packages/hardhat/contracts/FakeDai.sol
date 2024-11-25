// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FakeDai is ERC20, Ownable {
    string private constant TOKEN_NAME = "DAI";
    string private constant TOKEN_SYMBOL = "DAI";

    constructor(address owner) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        transferOwnership(owner);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

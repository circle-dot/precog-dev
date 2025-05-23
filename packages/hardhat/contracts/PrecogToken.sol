// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrecogToken is ERC20, ERC20Burnable, Ownable {
    string private constant TOKEN_NAME = "PrecogToken";
    string private constant TOKEN_SYMBOL = "PRE";

    constructor(address precogMaster) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        transferOwnership(precogMaster);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    function move(address from, address to, uint256 amount) external onlyOwner {
        _transfer(from, to, amount);
    }
}

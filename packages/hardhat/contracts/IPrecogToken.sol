// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IPrecogToken: interface to interact with Precog Token
 */
interface IPrecogToken is IERC20 {
    /**
     * @notice Mint new tokens for the specified address (limited to only owner)
     * @param to The address of the new tokens receiver
     * @param amount The amount of tokens to be minted
     * @dev Emits a {Transfer} event from the zero address as source
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burn already minted tokens from the specified address (limited to only owner)
     * @param from The address of the token source
     * @param amount The amount of tokens to be burn
     * @dev Emits a {Transfer} event to the zero address as destination
     */
    function burn(address from, uint256 amount) external;

    /**
     * @notice Transfer tokens from one address to another (limited to only owner)
     * @param from The address of the token source
     * @param to The address of the token receiver
     * @dev Emits a {Transfer} event
     */
    function move(address from, address to, uint256 amount) external;

    /**
     * @notice Transfer ownership of the contract to a new address (limited to only owner)
     * @param newOwner The address of the new owner
     * @dev Emits a {OwnershipTransferred} event with the previous and new owner addresses
     */
    function transferOwnership(address newOwner) external;

    /**
     * @notice Get the current owner of the contract
     * @return Address of the current owner
     */
    function owner() external view returns (address);

    /**
     * @notice Emitted when ownership of the contract is transferred to a new address
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}

// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

/**
 * @title IPrecogMarket: simple interface to interact with all Precog Markets
 * @author Marto (https://github.com/0xMarto)
 * @dev Feel free to make any adjustments to the code (DMs are open @0xMarto)
 */
interface IPrecogMarket {
    // Public market variables
    function owner() external view returns (address);

    function token() external view returns (address);

    function id() external view returns (uint256);

    function totalOutcomes() external view returns (uint256);

    function oracle() external view returns (address);

    function startTimestamp() external view returns (uint256);

    function endTimestamp() external view returns (uint256);

    function closeTimestamp() external view returns (uint256);

    function result() external view returns (uint256);

    function accountShares(address _account) external view returns (
        uint256 buys, uint256 sells, uint256 deposited, uint256 withdrew, uint256 redeemed
    );

    // Events emitted by markets
    event SharesBought(address indexed account, uint256 indexed outcome, uint256 amount, uint256 tokenIn);
    event SharesSold(address indexed account, uint256 indexed outcome, uint256 amount, uint256 tokenOut);
    event SharesRedeemed(address indexed account, uint256 indexed outcome, uint256 amount, uint256 tokenOut);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @notice Initializes the contract with the specified token
     * @param _token The address of the ERC-20 token to be used for buy, sell, and redeem shares
     */
    function initialize(address _token) external;

    /**
     * @notice Sets up the market with the specified parameters
     * @param _id The unique identifier for the market
     * @param _oracle The address of the oracle that will report results
     * @param _totalOutcomes The number of possible outcomes for the market
     * @param _subsidy The initial funding used to seed the market (defined on initialized token)
     * @param _overround The AMM profit margin in basis points (bps) [recommended: (100 * _totalOutcomes)]
     */
    function setup(uint256 _id, address _oracle, uint256 _totalOutcomes, uint256 _subsidy, uint256 _overround) external;

    /**
     * @notice Buys outcome shares for the specified outcome
     * @param _outcome The outcome of which shares are being bought (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome tokens to buy (as a signed 64.64-bit fixed point number)
     * @return tokenCost The total token amount used for buying the specified amount of outcome shares
     */
    function buy(uint256 _outcome, int128 _amount) external returns (uint256 tokenCost);

    /**
     * @notice Allows buying market shares for a specified account (limited to only Self or Owner)
     * @param _outcome The outcome of which shares are being bought (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome shares to buy (as a signed 64.64-bit fixed point number)
     * @param _account The address of the buyer
     * @return tokenCost The total token amount used for buying the specified amount of outcome shares
     */
    function _buy(uint256 _outcome, int128 _amount, address _account) external returns (uint256 tokenCost);

    /**
     * @notice Sells outcome shares for the specified outcome
     * @param _outcome The outcome of which shares are being sold (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome shares to sell (as a signed 64.64-bit fixed point number)
     * @return tokenReturn The total amount of tokens received from selling the outcome shares
     */
    function sell(uint256 _outcome, int128 _amount) external returns (uint256 tokenReturn);

    /**
     * @notice Allows selling market shares from a specified account (limited to only Self or Owner)
     * @param _outcome The outcome for which tokens are being sold (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome tokens to sell (as a signed 64.64-bit fixed point number)
     * @param _account The address of the seller
     * @return tokenReturn The total amount of tokens received from selling the outcome shares
     */
    function _sell(uint256 _outcome, int128 _amount, address _account) external returns (uint256 tokenReturn);

    /**
     * @notice Reports the result of the market (limited to only Oracle)
     * @param _id The unique identifier of the market
     * @param _outcome The outcome that is reported as the result of the market
     */
    function reportResult(uint256 _id, uint256 _outcome) external;

    /**
     * @notice Redeems the current sender shares for the result of the market
     * @return redeemedShares The number of shares redeemed
     */
    function redeemShares() external returns (uint256 redeemedShares);

    /**
     * @notice Redeems the received account shares for the result of the market (limited to only Self or Owner)
     * @param _account The address of the account with shares of the market
     * @return redeemedShares The number of shares redeemed
     */
    function _redeem(address _account) external returns (uint256 redeemedShares);

    /**
     * @notice Redeems shares in batch for multiple accounts  (limited to only Oracle)
     * @param _accounts The list of accounts to redeem shares for
     * @dev The list of accounts could be calculated using the "SharesBought" event
     * @return redeems The number of successful redeems
     */
    function redeemBatch(address[] memory _accounts) external returns (uint256 redeems);

    /**
     * @notice Withdraws any remaining liquidity from the market (limited to only owner)
     * @param _token The address of the ERC-20 token to withdraw
     */
    function withdraw(address _token) external;

    /**
     * @notice Transfers the ownership of the contract to a new owner (limited to only current owner)
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(address _newOwner) external;

    /**
     * @notice Update the oracle address of the market (limited to only owner)
     * @param _newOracle The address of the EOA or contract that can close the market
     */
    function updateOracle(address _newOracle) external;

    /**
     * @notice Updates the start and end timestamps for the market (limited to only owner)
     * @param _startTimestamp The timestamp when the market starts allowing trading
     * @param _endTimestamp The timestamp when the market stops allowing trading
     */
    function updateDates(uint256 _startTimestamp, uint256 _endTimestamp) external;

    /**
     * @notice Gets the total collateral spent in the market
     * @return totalCost The total cost in the form of a signed 64.64-bit fixed point number
     */
    function cost() external view returns (int128 totalCost);

    /**
     * @notice Gets the cost of buying the specified amount of outcome tokens
     * @param _outcome The outcome for which tokens are being bought
     * @param _amount The number of outcome tokens to buy (as signed 64.64-bit fixed point number)
     * @return tokenCost The token cost amount (as a signed 64.64-bit fixed point number)
     */
    function buyPrice(uint256 _outcome, int128 _amount) external view returns (int128 tokenCost);

    /**
     * @notice Gets the return from selling the specified amount of outcome tokens
     * @param _outcome The outcome for which tokens are being sold
     * @param _amount The number of outcome tokens to sell (as signed 64.64-bit fixed point number)
     * @return tokenReturn The token return amount (as a signed 64.64-bit fixed point number)
     */
    function sellPrice(uint256 _outcome, int128 _amount) external view returns (int128 tokenReturn);

    /**
     * @notice Gets the current market state information
     * @return totalShares The current total shares minted for all outcomes of the market
     * @return sharesBalances All shares balances (indexed by outcome)
     * @return currentCost The current liquidity of the market
     * @return totalBuys Buys counter of the market
     * @return totalSells Sells counter of the market
     */
    function getMarketInfo() external view returns (
        int128 totalShares, int128[] memory sharesBalances, int128 currentCost, uint256 totalBuys, uint256 totalSells
    );

    /**
     * @notice Get current market buy and sell prices for all outcomes
     * @dev Helper function to fast calculate market prediction and spreads
     * @return buyPrices buy price of 1 share for all outcomes (indexed by outcome)
     * @return sellPrices sell price of 1 share for all outcomes (indexed by outcome)
     */
    function getPrices() external view returns (uint256[] memory buyPrices, uint256[] memory sellPrices);

    /**
     * @notice Gets the amount of shares that an account owns for all outcomes
     * @param _account The address of the account with shares of the market
     * @return balances The balances of shares for all outcomes (indexed by outcome)
     */
    function getAccountOutcomeBalances(address _account) external view returns (uint256[] memory balances);
}

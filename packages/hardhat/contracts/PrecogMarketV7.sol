// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ABDKMath64x64.sol";

/**
 * @title PrecogMarketV7: An implementation for liquidity-sensitive LMSR market maker in Solidity
 * @author Marto (https://github.com/0xMarto)
 * @dev Feel free to make any adjustments to the code (DMs are open @0xMarto)
 */
contract PrecogMarketV7 {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    struct SharesInfo {
        uint256 buys;  // Total amount of Buys
        uint256 sells;  // Total amount of Sells
        uint256 deposited; // Total collateral-in on Buys
        uint256 withdrew; // Total collateral-Out on Sells
        uint256 redeemed; // Total collateral-Out on Redeems
        mapping(uint256 => uint256) balances;  // Shares balances by outcome (has an custom getter)
    }

    // Public variables
    address public owner;  // Should be the PrecogMaster contract
    address public token;  // Collateral to Buy and redeem shares
    uint256 public id;  // Unique Identifier for the market
    uint256 public totalOutcomes; // Amount of outcomes (2 usually mean 1=YES, 2=NO)
    address public oracle;  // EOA or Contract in change to reportResults
    uint256 public startTimestamp;  // Time when Buy/Sell shares are enabled
    uint256 public endTimestamp;  // Time when Buy/Sell shares are disabled
    uint256 public closeTimestamp;  // Time when results were reported
    uint256 public result;  // Final outcome of the market (published by the oracle)
    mapping(address => SharesInfo) public accountShares;  // Account shares balances and info

    // Private variables
    int128[] private shares;  // Amount of shares indexed by outcome (signed 64.64 bit fixed point number)
    int128 private beta;  // LMSR market liquidity variable (signed 64.64 bit fixed point number)
    int128 private alpha;  // Liquidity-Sensitive LMSR market variable (signed 64.64 bit fixed point number)
    int128 private dust;  // Token leak mitigation variable used in share sells (signed 64.64 bit fixed point number)
    int128 private currentCost;  // Current amount of liquidity in the market (signed 64.64 bit fixed point number)
    int128 private totalShares;  // Total amount of shares of all outcomes (signed 64.64 bit fixed point number)
    uint256 private totalBuys;  // Total amount of buys made from all account
    uint256 private totalSells;  // Total amount of sells made from all account
    bool private marketSetup;  // Flag that indicates that a market was configured correctly
    bool private internalCall;  // Flag that indicates that the current call is internal

    // Events emitted
    event SharesBought(address indexed account, uint256 indexed outcome, uint256 amount, uint256 tokenIn);
    event SharesSold(address indexed account, uint256 indexed outcome, uint256 amount, uint256 tokenOut);
    event SharesRedeemed(address indexed account, uint256 indexed outcome, uint256 amount, uint256 tokenOut);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlyAfterSetup {
        require(marketSetup == true, "Not setup");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyOwnerOrInternal() {
        require(msg.sender == owner || internalCall, "Only owner or self");
        _;
        internalCall = false;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }

    /**
     * @notice Constructor like function for the market maker
     * @param _token ERC-20 token will be used to purchase and redeem rewards for this Market
     */
    function initialize(address _token) public {
        require(owner == address(0) && token == address(0), "Already initialized");
        owner = msg.sender;
        token = _token;
    }

    /**
     * @notice Sets up the market with the specified parameters
     * @param _id The unique identifier for the market
     * @param _oracle The address of the oracle that will report results
     * @param _totalOutcomes The number of possible outcomes for the market
     * @param _subsidy The initial funding used to seed the market (defined on initialized token)
     * @param _overround The AMM profit margin in basis points (bps) [recommended: (100 * _totalOutcomes)]
     */
    function setup(uint _id, address _oracle, uint _totalOutcomes, uint _subsidy, uint _overround) public onlyOwner {
        require(!marketSetup, "Already setup");
        require(_overround > 0, "Unsupported overround");
        require(_totalOutcomes > 0, "Unsupported outcomes");

        // Get initial funding tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), _subsidy);

        // Save basic parameters
        id = _id;
        oracle = _oracle;
        totalOutcomes = _totalOutcomes;

        // Calculate initialization variables
        int128 initialSubsidy = getTokenEth(token, _subsidy);
        int128 n = ABDKMath.fromUInt(_totalOutcomes);
        int128 overround = ABDKMath.divu(_overround, 10_000); // if the overround is too low the exp function overflows
        alpha = ABDKMath.div(overround, ABDKMath.mul(n, ABDKMath.ln(n)));
        beta = ABDKMath.mul(ABDKMath.mul(initialSubsidy, n), alpha);
        shares = new int128[](totalOutcomes.add(1));
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            shares[outcome] = initialSubsidy;
            totalShares = ABDKMath.add(totalShares, initialSubsidy);
        }

        // Initialize token leak mitigation of 0.001% (could be a setup parameter in the future)
        // Note: Needed to avoid leaks due to rounding errors on math logarithmic and exponential approximations
        dust = ABDKMath.fromUInt(100_000);  // 100k as signed 64.64 bit fixed point

        // Register successful initialization
        marketSetup = true;

        // Optimization: pre calculate current cost to avoid extra calculation on buys and sells
        currentCost = cost();
    }

    /**
     * @notice Buys outcome shares for the specified outcome
     * @param _outcome The outcome of which shares are being bought (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome shares to buy (as a signed 64.64-bit fixed point number)
     * @return tokenCost The total token amount used for buying the specified amount of outcome shares
     */
    function buy(uint256 _outcome, int128 _amount) public onlyAfterSetup returns (uint256 tokenCost) {
        // Send BUY call to internal function with msg sender
        internalCall = true;
        return _buy(_outcome, _amount, msg.sender);
    }

    /**
     * @notice Allows buying market shares for a specified account (limited to only Self or Owner)
     * @param _outcome The outcome of which shares are being bought (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome shares to buy (as a signed 64.64-bit fixed point number)
     * @param _account The address of the buyer
     * @return tokenCost The total token amount used for buying the specified amount of outcome shares
     */
    function _buy(uint256 _outcome, int128 _amount, address _account) public onlyOwnerOrInternal
    returns (uint256 tokenCost) {
        require(_outcome > 0 && _outcome <= totalOutcomes, "Invalid outcome");
        require(_amount > 0, "Invalid amount");
        require(block.timestamp >= startTimestamp, "Market not started");
        require(endTimestamp == 0 || block.timestamp <= endTimestamp, "Market already ended");
        require(closeTimestamp == 0, "Market already closed");

        // Add amount of shares to be bought from individual and total shares counters
        shares[_outcome] = ABDKMath.add(shares[_outcome], _amount);
        totalShares = ABDKMath.add(totalShares, _amount);

        // Calculate new BETA parameter (taking into account new total shares and fixed alpha)
        beta = ABDKMath.mul(totalShares, alpha);

        // Calculate new current cost and price to pay. After that, update current cost variable
        int128 sumTotal;
        for (uint outcome = 1; outcome <= totalOutcomes; outcome++) {
            sumTotal = ABDKMath.add(sumTotal, ABDKMath.exp(ABDKMath.div(shares[outcome], beta)));
        }
        int128 newCost = ABDKMath.mul(beta, ABDKMath.ln(sumTotal));
        int128 deltaCost = ABDKMath.sub(newCost, currentCost);
        currentCost = newCost;

        // Get amount of tokens from sender (as current payment)
        tokenCost = getTokenWei(token, deltaCost);
        require(tokenCost > 0, "Invalid cost");
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenCost);
        uint outcomeShares = getTokenWei(token, _amount);

        // Register BUY in market total and Account details
        totalBuys = totalBuys.add(1);
        accountShares[_account].buys = accountShares[_account].buys.add(1);
        accountShares[_account].deposited = accountShares[_account].deposited.add(tokenCost);
        accountShares[_account].balances[_outcome] = accountShares[_account].balances[_outcome].add(outcomeShares);

        emit SharesBought(_account, _outcome, outcomeShares, tokenCost);
        return tokenCost;
    }

    /**
     * @notice Sells outcome shares for the specified outcome
     * @param _outcome The outcome of which shares are being sold (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome shares to sell (as a signed 64.64-bit fixed point number)
     * @return tokenReturn The total amount of tokens received from selling the outcome shares
     */
    function sell(uint256 _outcome, int128 _amount) public onlyAfterSetup returns (uint256 tokenReturn) {
        // Send SELL call to internal function
        internalCall = true;
        return _sell(_outcome, _amount, msg.sender);
    }

    /**
     * @notice Allows selling market shares from a specified account (limited to only Self or Owner)
     * @param _outcome The outcome for which shares are being sold (e.g.: 1 for YES, 2 for NO)
     * @param _amount The number of outcome shares to sell (as a signed 64.64-bit fixed point number)
     * @param _account The address of the seller
     * @return tokenReturn The total amount of tokens received from selling the outcome shares
     */
    function _sell(uint256 _outcome, int128 _amount, address _account) public onlyOwnerOrInternal
    returns (uint256 tokenReturn) {
        require(_outcome > 0 && _outcome <= totalOutcomes, "Invalid outcome");
        require(_amount > 0, "Invalid amount");
        require(block.timestamp >= startTimestamp, "Market not started");
        require(endTimestamp == 0 || block.timestamp <= endTimestamp, "Market already ended");
        require(closeTimestamp == 0, "Market already closed");

        // Remove amount of shares to be sold from individual and total shares counters
        shares[_outcome] = ABDKMath.sub(shares[_outcome], _amount);
        totalShares = ABDKMath.sub(totalShares, _amount);

        // Calculate new BETA parameter (taking into account new total shares and fixed alpha)
        beta = ABDKMath.mul(totalShares, alpha);

        // Calculate new cost and tokens to return. After that, update current cost variable
        int128 sumTotal;
        for (uint outcome = 1; outcome <= totalOutcomes; outcome++) {
            sumTotal = ABDKMath.add(sumTotal, ABDKMath.exp(ABDKMath.div(shares[outcome], beta)));
        }
        int128 newCost = ABDKMath.mul(beta, ABDKMath.ln(sumTotal));
        int128 deltaCost = ABDKMath.sub(currentCost, newCost);
        int128 deltaDust = ABDKMath.div(deltaCost, dust);  // Token leak mitigation
        currentCost = newCost;

        // Calculate return amount of token to send
        tokenReturn = getTokenWei(token, ABDKMath.sub(deltaCost, deltaDust));

        require(tokenReturn > 0, "Invalid return");
        uint outcomeShares = getTokenWei(token, _amount);

        // Check that the received account have the amount of shares to sell
        require(accountShares[_account].balances[_outcome] >= outcomeShares, "Insufficient balance");

        // Register SELL in market total and Account details
        totalSells = totalSells.add(1);
        accountShares[_account].sells = accountShares[_account].sells.add(1);
        accountShares[_account].withdrew = accountShares[_account].withdrew.add(tokenReturn);
        accountShares[_account].balances[_outcome] = accountShares[_account].balances[_outcome].sub(outcomeShares);

        // Transfer collateral tokens to received account
        IERC20(token).safeTransfer(_account, tokenReturn);

        emit SharesSold(_account, _outcome, outcomeShares, tokenReturn);
        return tokenReturn;
    }

    /**
     * @notice Updates the start and end timestamps for the market (limited to only owner)
     * @param _startTimestamp The timestamp when the market starts allowing trading
     * @param _endTimestamp The timestamp when the market stops allowing trading
     */
    function updateDates(uint256 _startTimestamp, uint256 _endTimestamp) public onlyOwner {
        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
    }

    /**
     * @notice Update the oracle address of the market (limited to only owner)
     * @param _newOracle The address of the EOA or contract that can close the market
     */
    function updateOracle(address _newOracle) public onlyOwner {
        require(_newOracle != address(0), "Invalid new oracle");
        oracle = _newOracle;
    }

    /**
     * @notice Reports the result of the market (limited to only Oracle)
     * @param _id The unique identifier of the market
     * @param _outcome The outcome that is reported as the result of the market
     */
    function reportResult(uint256 _id, uint256 _outcome) public onlyOracle {
        // Validate received inputs
        require(_id == id, "Invalid market");
        require(_outcome > 0 && _outcome <= totalOutcomes, "Invalid outcome");

        // Check current state of the market
        require(block.timestamp > endTimestamp, "Market not ended");
        require(closeTimestamp == 0, "Market already closed");

        // Register reported results and register current time
        result = _outcome;
        closeTimestamp = block.timestamp;
    }

    /**
     * @notice Redeems the current sender shares for the result of the market
     * @return redeemedShares The number of shares redeemed
     */
    function redeemShares() public onlyAfterSetup returns (uint256 redeemedShares) {
        internalCall = true;
        return _redeem(msg.sender);
    }

    /**
     * @notice Redeems shares in batch for multiple accounts  (limited to only Oracle)
     * @param _accounts The list of accounts to redeem shares for
     * @dev The list of accounts could be calculated using the "SharesBought" event
     * @return redeems The number of successful redeems
     */
    function redeemBatch(address[] memory _accounts) public onlyAfterSetup onlyOracle returns (uint256 redeems) {
        for (uint256 i = 0; i < _accounts.length; i++) {
            internalCall = true;
            try this._redeem(_accounts[i]) {
                redeems.add(1);
            } catch {
                // CASE: `_redeem` call reverted (expected if the account don't have redeemable shares)
                internalCall = false; // Disable internal just incase of revert
            }
        }
        return redeems;
    }

    /**
     * @notice Redeems the received account shares for the result of the market (limited to only Self or Owner)
     * @param _account The address of the account with shares of the market
     * @return redeemedShares The number of shares redeemed
     */
    function _redeem(address _account) public onlyOwnerOrInternal returns (uint256 redeemedShares) {
        // Check current state of the market and received account
        require(closeTimestamp > 0, "Market not closed");
        require(accountShares[_account].redeemed == 0, "Shares already redeemed");

        // Get amount of shares to be redeemed for received account
        redeemedShares = accountShares[_account].balances[result];
        require(redeemedShares > 0, "Nothing to redeem");

        // Register amount of shares redeemed and send corresponding collateral tokens (ratio 1:1)
        accountShares[_account].redeemed = redeemedShares;
        IERC20(token).safeTransfer(_account, redeemedShares);

        emit SharesRedeemed(_account, result, redeemedShares, redeemedShares);
        return redeemedShares;
    }

    /**
     * @notice Withdraws any remaining liquidity from the market (limited to only owner)
     * @param _token The address of the ERC-20 token to withdraw
     */
    function withdraw(address _token) public onlyAfterSetup onlyOwner {
        require(closeTimestamp > 0, "Market not closed");
        IERC20(_token).safeTransfer(msg.sender, IERC20(_token).balanceOf(address(this)));
    }

    /**
     * @notice Transfers the ownership of the contract to a new owner (limited to only current owner)
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(address _newOwner) public virtual onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @notice Gets the total collateral spent in the market
     * @return totalCost The total cost in the form of a signed 64.64-bit fixed point number
     */
    function cost() public view onlyAfterSetup returns (int128 totalCost) {
        int128 sumTotal;
        for (uint outcome = 1; outcome <= totalOutcomes; outcome++) {
            sumTotal = ABDKMath.add(sumTotal, ABDKMath.exp(ABDKMath.div(shares[outcome], beta)));
        }
        return ABDKMath.mul(beta, ABDKMath.ln(sumTotal));
    }

    /**
     * @notice Gets the cost of buying the specified amount of outcome shares
     * @param _outcome The outcome for which shares are being bought
     * @param _amount The number of outcome shares to buy (as signed 64.64-bit fixed point number)
     * @return tokenCost The token cost amount (as a signed 64.64-bit fixed point number)
     */
    function buyPrice(uint256 _outcome, int128 _amount) public view returns (int128 tokenCost) {
        return ABDKMath.sub(costAfterBuy(_outcome, _amount), currentCost);
    }

    /**
     * @notice Gets the return from selling the specified amount of outcome shares
     * @param _outcome The outcome for which shares are being sold
     * @param _amount The number of outcome shares to sell (as signed 64.64-bit fixed point number)
     * @return tokenReturn The token return amount (as a signed 64.64-bit fixed point number)
     */
    function sellPrice(uint256 _outcome, int128 _amount) public view returns (int128 tokenReturn) {
        int128 deltaCost = ABDKMath.sub(currentCost, costAfterSell(_outcome, _amount));
        int128 deltaDust = ABDKMath.div(deltaCost, dust);  // token leak mitigation
        return ABDKMath.sub(deltaCost, deltaDust);
    }

    /**
     * @notice Gets the current market state information
     * @return totalShares The current total shares minted for all outcomes of the market
     * @return sharesBalances All shares balances (indexed by outcome)
     * @return currentCost The current liquidity of the market
     * @return totalBuys Buys counter of the market
     * @return totalSells Sells counter of the market
     */
    function getMarketInfo() public view returns (int128, int128[] memory, int128, uint256, uint256) {
        int128[] memory sharesBalances = new int128[](totalOutcomes.add(1));

        if (!marketSetup) {
            return (0, sharesBalances, 0, 0, 0);
        }

        // Populate shares balances based on total outcomes configured for this market
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            sharesBalances[outcome] = shares[outcome];
        }

        return (totalShares, sharesBalances, currentCost, totalBuys, totalSells);
    }

    /**
     * @notice Gets current market buy and sell prices for all outcomes
     * @dev Helper function to fast calculate market prediction and spreads
     * @return buyPrices buy price of 1 share for all outcomes (indexed by outcome)
     * @return sellPrices sell price of 1 share for all outcomes (indexed by outcome)
     */
    function getPrices() public view returns (uint256[] memory buyPrices, uint256[] memory sellPrices) {
        buyPrices = new uint256[](totalOutcomes.add(1));
        sellPrices = new uint256[](totalOutcomes.add(1));
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            int128 oneShare = 18446744073709551616;  // 1 share as int128 (signed 64.64 bit fixed point number)
            buyPrices[outcome] = getTokenWei(token, buyPrice(outcome, oneShare));
            sellPrices[outcome] = getTokenWei(token, sellPrice(outcome, oneShare));
        }
        return (buyPrices, sellPrices);
    }

    /**
     * @notice Gets the amount of shares that an account owns for all outcomes
     * @param _account The address of the account with shares of the market
     * @return balances The balances of shares for all outcomes (indexed by outcome)
     */
    function getAccountOutcomeBalances(address _account) public view returns (uint256[] memory balances) {
        balances = new uint256[](totalOutcomes.add(1));
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            balances[outcome] = accountShares[_account].balances[outcome];
        }
        return balances;
    }

    /**
     *  @notice Gets the total collateral spent in the market after a received BUY trade
     *  @dev Internal function used to calculate buy price
     */
    function costAfterBuy(uint256 _outcome, int128 _amount) internal view returns (int128) {
        int128 newSumTotal;
        int128[] memory newShares = new int128[](shares.length);
        int128 newTotalShares = totalShares;

        // Add new amount of shares to received outcome
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            if (outcome == _outcome) {
                newShares[outcome] = ABDKMath.add(shares[outcome], _amount);
                newTotalShares = ABDKMath.add(newTotalShares, _amount);
            } else {
                newShares[outcome] = shares[outcome];
            }
        }

        // Calculate new cost based on newTotalShares and newQ values
        int128 newBeta = ABDKMath.mul(newTotalShares, alpha);
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            newSumTotal = ABDKMath.add(newSumTotal, ABDKMath.exp(ABDKMath.div(newShares[outcome], newBeta)));
        }
        return ABDKMath.mul(newBeta, ABDKMath.ln(newSumTotal));
    }

    /**
     *  @notice Gets the total collateral spent in the market after a received SELL trade
     *  @dev Internal function used to calculate sell price
     */
    function costAfterSell(uint256 _outcome, int128 _amount) internal view returns (int128) {
        int128 newSumTotal;
        int128[] memory newShares = new int128[](shares.length);
        int128 newTotalShares = totalShares;

        // Add new amount of shares to received outcome
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            if (outcome == _outcome) {
                newShares[outcome] = ABDKMath.sub(shares[outcome], _amount);
                newTotalShares = ABDKMath.sub(newTotalShares, _amount);
            } else {
                newShares[outcome] = shares[outcome];
            }
        }

        // Calculate new cost based on newTotalShares and newShares values
        int128 newBeta = ABDKMath.mul(newTotalShares, alpha);
        for (uint256 outcome = 1; outcome <= totalOutcomes; outcome++) {
            newSumTotal = ABDKMath.add(newSumTotal, ABDKMath.exp(ABDKMath.div(newShares[outcome], newBeta)));
        }
        return ABDKMath.mul(newBeta, ABDKMath.ln(newSumTotal));
    }

    /**
     *  @notice Translate int128 (signed 64.64 bit fixed point number) [in ether] to uint256 token amount [in wei]
     *  @dev Internal function used to transform encoded number values
     */
    function getTokenWei(address _token, int128 _amount) internal view returns (uint256) {
        uint256 decimals = ERC20(_token).decimals();
        return ABDKMath.mulu(_amount, 10 ** decimals);
    }

    /**
     *  @notice Translate uint256 token amount [in wei] to int128 (signed 64.64 bit fixed point number) [in ether]
     *  @dev Internal function used to transform encoded number values
     */
    function getTokenEth(address _token, uint256 _amount) internal view returns (int128) {
        uint256 decimals = ERC20(_token).decimals();
        return ABDKMath.divu(_amount, 10 ** decimals);
    }
}

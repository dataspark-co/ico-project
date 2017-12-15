pragma solidity ^0.4.15;

import './Pausable.sol';
import '../math/SafeMath.sol';
import './FlipsiToken.sol';

contract FlipsiCrowdsale is Pausable{

    // The beneficiary is the future recipient of the funds
    address public beneficiary;

    // Time period of sale (UNIX timestamps)
    uint public startTime;
    uint public endTime;

    //presale tokens amount hardcap
    uint public hardcap = 70000000;

    // Keeps track of the amount of tokens raised
    uint public tokensSold;

    // Keeps track of the amount of wei raised
    uint public amountRaised;


    // A map that tracks the amount of wei contributed by address
    mapping(address => uint256) public balanceOf;

    // The token being sold
    FlipsiToken public tokenReward;

    // The ratio of QSP to Ether
    uint public rate;

    // The crowdsale has a funding goal, cap, deadline, and minimum contribution
 //   uint public fundingGoal;
 //   uint public fundingCap;
    uint public minContributionInTokens = 40; 
    uint public minContribution; 

    bool public saleClosed = false;

    // Modifiers
    modifier beforeDeadline()   { require (currentTime() < endTime); _; }
    modifier afterDeadline()    { require (currentTime() >= endTime); _; }
    modifier afterStartTime()    { require (currentTime() >= startTime); _; }
    modifier saleNotClosed()    { require (!saleClosed); _; }


    // interfaces:
    function getBonus(uint tokensAmount) internal constant returns(uint);

    /**
     * This fallback function is called whenever Ether is sent to the
     * smart contract. It can only be executed when the crowdsale is
     * not paused, not closed, and before the deadline has been reached.
     *
     * This function will update state variables for whether or not the
     * funding goal or cap have been reached. It also ensures that the
     * tokens are transferred to the sender, and that the correct
     * number of tokens are sent according to the current rate.
     */
    function () public payable whenNotPaused beforeDeadline afterStartTime saleNotClosed {
        require(msg.value >= minContribution);

        // Update the sender's balance of wei contributed and the amount raised
        uint amount = msg.value;
        uint currentBalance = balanceOf[msg.sender];
        balanceOf[msg.sender] = currentBalance.add(amount);
        amountRaised = amountRaised.add(amount);

        // Compute the number of tokens to be rewarded to the sender
        // Note: it's important for this calculation that both wei
        // and QSP have the same number of decimal places (18)
        uint numTokens = amount.mul(rate);

        // Transfer the tokens from the crowdsale supply to the sender
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //TODO ADD CHECKING THAT WE HAVEN'T ENAUGHT TOKENS TO SEND INVESTOR AND SEND HIM MAXIMIM AMOUNT AND RETURN UNSPENT MONEYS

        allocateTokens(msg.sender, numTokens);
    }


    //private
    function allocateTokens(address _to, uint amountFlp) private {

        uint tokens = amountFlp + getBonus(amountFlp);
        if (!tokenReward.transferFrom(tokenReward.owner(), _to, tokens)) {
            revert();
        }else{
            tokensSold.add(amountFlp);
        }
    }


    /**
     * The owner can call this function to withdraw the funds that
     * have been sent to this contract for the crowdsale subject to
     * the funding goal having been reached. The funds will be sent
     * to the beneficiary specified when the crowdsale was created.
     */
    function ownerSafeWithdrawal() public onlyOwner afterDeadline{
        uint balanceToSend = this.balance;
        beneficiary.transfer(balanceToSend);
    }


    /**
     * The owner can allocate the specified amount of tokens from the
     * crowdsale allowance to the recipient (_to).
     *
     * NOTE: be extremely careful to get the amounts correct, which
     * are in units of wei and mini-QSP. Every digit counts.
     *
     * @param _to            the recipient of the tokens
     * @param amountFlp     the amount contributed in tokens
     */
    function proxyBuyerBTC(address _to, uint amountFlp) external
            onlyOwner //TODO CHANGE TO ONLY PROXYBUYER
            whenNotPaused beforeDeadline afterStartTime saleNotClosed
    {
        allocateTokens(_to, amountFlp);
    }




    /**
     * The owner can update the rate (QSP to ETH).
     *
     * @param _rate  the new rate for converting QSP to ETH
     */
    function setRate(uint _rate) public onlyOwner {
        rate = _rate;
        minContribution = minContributionInTokens * _rate;
    }

    function getRate() external constant returns(uint) {
        return rate;
    }

  
    /**
     * The owner can terminate the crowdsale at any time.
     */
    function terminate() external onlyOwner {
        saleClosed = true;
    }


    /**
     * Returns the current time.
     * Useful to abstract calls to "now" for tests.
    */
    function currentTime() public constant returns (uint _currentTime) {
        return now;
    }

}

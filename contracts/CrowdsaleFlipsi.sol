pragma solidity ^0.4.15;

import './lifecycle/Pausable.sol';
import './math/SafeMath.sol';
import './FlipsiToken.sol';
import './FlipsiCrowdsale.sol';

contract FlipsiSale is  FlipsiCrowsale {

    using SafeMath for uint256;

    // Refund amount, should it be required
    uint public refundAmount;

    uint public softcap = 1000000; //amount of tokens


    /**
     * Constructor for a crowdsale of QuantstampToken tokens.
     *
     * @param ifSuccessfulSendTo            the beneficiary of the fund
     * @param minimumContributionInWei      minimum contribution (in wei)
     * @param start                         the start time (UNIX timestamp)
     * @param durationInMinutes             the duration of the crowdsale in minutes
     * @param rateQspToEther                the conversion rate from QSP to Ether
     * @param addressOfTokenUsedAsReward    address of the token being sold
     */
    function FlipsiSale(
        address ifSuccessfulSendTo,
        uint start,
        uint durationInMinutes,
        uint rateFlpToEther,
        address addressOfTokenUsedAsReward
    ) {
        require(durationInMinutes > 0);

        startTime = start;
        endTime = start + durationInMinutes * 1 minutes; // TODO double check
        setRate(rateFlpToEther);

        beneficiary = ifSuccessfulSendTo;
        tokenReward = FlipsiToken(addressOfTokenUsedAsReward);
    }


    /**
     * This function permits anybody to withdraw the funds they have
     * contributed if and only if the deadline has passed and the
     * funding goal was not reached.
     */
    function safeWithdrawal() external afterDeadline {
        if (tokensSold < softcap) {
            uint amount = balanceOf[msg.sender];
            balanceOf[msg.sender] = 0;
            if (amount > 0) {
                msg.sender.transfer(amount);
                refundAmount = refundAmount.add(amount);
            }
        }
    }


  /**
    * Add bonuses for sender regarding bonuses schedule
    * @param tokensAmount - amount of bought tokens without bonuses
    */
  function getBonus(uint tokensAmount) internal constant returns(uint) {
    uint bonusTokens = 0;
    
    // First bonus period
    if (now < "2017-01-10 00:00:00") {
      bonusTokens = tokensAmount.div(100).mul(30);
      
    // Second bonus period
    } else if (now < "2017-01-18 00:00:00") {
      bonusTokens = tokensAmount.div(100).mul(20);
      
    // Third bonus period
    } else if (now < "2017-01-26 00:00:00") {
      bonusTokens = tokensAmount.div(100).mul(10);
    
    // Fourth bonus period
    } else if (now < "2017-02-02 00:00:00") {
      bonusTokens = tokensAmount.div(100).mul(5);
    }
    
    return bonusTokens;
  }
}


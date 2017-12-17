pragma solidity ^0.4.15;

import './Pausable.sol';
import '../math/SafeMath.sol';
import './FlipsiToken.sol';
import './FlipsiCrowdsale.sol';

contract FlipsiPreSale is FlipsiCrowdsale {

    using SafeMath for uint256;

    /**
     * Constructor for a crowdsale of QuantstampToken tokens.
     *
     * @param ifSuccessfulSendTo            the beneficiary of the fund
     * @param start                         the start time (UNIX timestamp)
     * @param durationInMinutes             the duration of the crowdsale in minutes
     * @param rateFlpToEther                the conversion rate from QSP to Ether
     * @param addressOfTokenUsedAsReward    address of the token being sold
     */
    function FlipsiPreSale(
        address ifSuccessfulSendTo,
        uint start,
        uint durationInMinutes,
        uint rateFlpToEther,
        uint presaleHardcap,
        address addressOfTokenUsedAsReward
    ) public {
        require(durationInMinutes > 0);

        startTime = start;
        endTime = start + durationInMinutes * 1 minutes; // TODO double check
        setRate(rateFlpToEther);
        hardcap = presaleHardcap;
        beneficiary = ifSuccessfulSendTo;
        tokenReward = FlipsiToken(addressOfTokenUsedAsReward);
    }




  /**
    * Add bonuses for sender regarding bonuses schedule
    * @param tokensAmount - amount of bought tokens without bonuses
    */
  function getBonus(uint tokensAmount) internal constant returns(uint) {
    return tokensAmount.div(100).mul(40);
  }

}
 
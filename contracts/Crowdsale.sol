pragma solidity ^0.4.18;

import './FlipsiToken.sol';
import '../math/SafeMath.sol';


contract Crowdsale is Ownable {
    using SafeMath for uint;

    address owner;
    address wallet;
    mapping(string => address) restrictedAddresses;
    mapping(string => uint) restrictedPercents;
    uint softcap;
    uint hardcap;
    uint rate;
    uint start;
    uint period;
    
    mapping(string => mapping(string => uint)) bonuses;

    FlipsiTokenCoin public token = new FlipsiTokenCoin();
    
    modifier saleIsOn() {
        require(now > start && now < (start + period * 1 days));
        _;
    }
    
    function Crowdsale() {
        wallet = 0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770;
        restrictedAddresses["founders"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["team"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["advisors"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["bounty"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["devteam"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        // 100% mean 1000
        restrictedPercents["founders"] = 100; // 10%
        restrictedPercents["team"] = 100; // 10%
        restrictedPercents["advisors"] = 100; // 10%
        restrictedPercents["bounty"] = 100;  // 10%
        restrictedPercents["devteam"] = 1; // 0.1%
        
        rate = 400000000000000000000; // 400 tokens per 1 ETH
        start = 1511810000;
        softcap = 2000000000000000000000000; // 2 000 000 
        hardcap = 20000000000000000000000000; // 20 000 000 
        period = 35;
        
        // TODO: update
        bonuses["firstPeriod"]["lastDay"] = 7 * 1 days;
        bonuses["firstPeriod"]["percent"] = 25;
        bonuses["secondPeriod"]["lastDay"] = 14 * 1 days;
        bonuses["secondPeriod"]["percent"] = 10;
        bonuses["thirdPeriod"]["lastDay"] = 21 * 1 days;
        bonuses["thirdPeriod"]["percent"] = 5;
    }
    
    function createTokens() public saleIsOn payable {
        wallet.transfer(msg.value);
        uint tokens = rate.mul(msg.value).div(1 ether);
        tokens += countBonus(tokens);
        token.transfer(msg.sender, tokens);
        
        // TODO: update
        // uint restrictedTokens = tokens.mul(restrictedPercent).div(100 - restrictedPercent);
        // token.transfer(restricted, restrictedTokens);
    }
    
    function countBonus(uint tokensAmount) internal constant returns(uint) {
        uint bonusTokens = 0;
        
        // First bonus period
        // TODO: update
        if (now < start + bonuses["firstPeriod"]["lastDay"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["firstPeriod"]["percent"]);
        // Second bonus period
        } else if (now >= bonuses["firstPeriod"]["lastDay"] && now < start + bonuses["secondPeriod"]["lastDay"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["secondPeriod"]["percent"]);
          
        // Second bonus period
        } else if (now >= start + bonuses["secondPeriod"]["lastDay"] && now < start + bonuses["thirdPeriod"]["lastDay"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["thirdPeriod"]["percent"]);
        }
        
        return bonusTokens;
    }
    
    function() external payable {
        createTokens();
    }
}
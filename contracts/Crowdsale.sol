pragma solidity ^0.4.18;

import './FlipsiToken.sol';
import '../math/SafeMath.sol';


contract Crowdsale is Ownable {
    using SafeMath for uint;

    address owner;
    address multisigWallet;
    mapping(string => address) restrictedAddresses;
    mapping(string => uint) restrictedPercents;
    uint softcap;
    uint start;
    uint end;
    uint hardcap;
    uint rate;
    
    mapping(string => mapping(string => uint)) bonuses;

    FlipsiTokenCoin public token = new FlipsiTokenCoin();
    
    modifier saleIsOn() {
        require(now >= start && now < end);
        _;
    }
    
    function Crowdsale() {
        // TODO: update address
        multisigWallet = 0xEA15Adb66DC92a4BbCcC8Bf32fd25E2e86a2A770;
        rate = 400000000000000000000; // 400 tokens per 1 ETH
        start = 1516838400; // 2018-01-25T00:00:00+00:00
        end = 1519776000; // 2018-02-28T00:00:00+00:00
        softcap = 2000000000000000000000000; // 2 000 000 
        hardcap = 20000000000000000000000000; // 20 000 000 

        bonuses["firstPeriod"]["percent"] = 20;
        bonuses["firstPeriod"]["endDate"] = 1517443200; // 2018-02-01T00:00:00+00:00
        bonuses["secondPeriod"]["percent"] = 15;
        bonuses["secondPeriod"]["endDate"] = 1518048000; // 2018-02-08T00:00:00+00:00
        bonuses["thirdPeriod"]["percent"] = 10;
        bonuses["thirdPeriod"]["endDate"] = 1518652800; // 2018-02-15T00:00:00+00:00
        bonuses["fourthPeriod"]["percent"] = 5;
        bonuses["fourthPeriod"]["endDate"] = 1519257600; // 2018-02-22T00:00:00+00:00
        
        transferAllRestrictedTokens();
    }
    
    function createTokens() public saleIsOn payable {
        multisigWallet.transfer(msg.value);
        uint tokens = rate.mul(msg.value).div(1 ether);
        tokens += getBonus(tokens);
        token.transfer(msg.sender, tokens);
    }
    
    /**
     * Add bonuses for sender regarding bonuses schedule
     * @param tokensAmount - amount of bought tokens without bonuses
     */
    function getBonus(uint tokensAmount) internal constant returns(uint) {
        uint bonusTokens = 0;
        
        // First bonus period
        if (now < bonuses["firstPeriod"]["endDate"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["firstPeriod"]["percent"]);
          
        // Second bonus period
        } else if (now >= bonuses["firstPeriod"]["endDate"] && now < bonuses["secondPeriod"]["endDate"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["secondPeriod"]["percent"]);
          
        // Third bonus period
        } else if (now >= bonuses["secondPeriod"]["endDate"] && now < bonuses["thirdPeriod"]["endDate"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["thirdPeriod"]["percent"]);
        
        // Fourth bonus period
        } else if (now >= bonuses["thirdPeriod"]["endDate"] && now < bonuses["fourthPeriod"]["endDate"]) {
          bonusTokens = tokensAmount.div(100).mul(bonuses["fourthPeriod"]["percent"]);
        }
        
        return bonusTokens;
    }
    
    /**
     * Init restricted data, count and transfer tokens to restricted accounts
     */
    function transferAllRestrictedTokens() internal {
        // TODO: update addresses
        restrictedAddresses["founders"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["team"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["advisors"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["bounty"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        restrictedAddresses["devteam"] = 0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De;
        // 100% means 1000 due not supporting decimals in Solidity
        restrictedPercents["founders"] = 100; // 10%
        restrictedPercents["team"] = 100; // 10%
        restrictedPercents["advisors"] = 100; // 10%
        restrictedPercents["bounty"] = 100;  // 10%
        restrictedPercents["devteam"] = 1; // 0.1%

        uint256 total = token.totalSupply();
        transferRestrictedTokens(total, "founders");
        transferRestrictedTokens(total, "team");
        transferRestrictedTokens(total, "advisors");
        transferRestrictedTokens(total, "bounty");
        transferRestrictedTokens(total, "devteam");
    }
    
    /**
     * Transfer tokens to restricted account by passed name
     */
    function transferRestrictedTokens(uint256 totalSupply, string holderName) internal {
         token.transfer(
            restrictedAddresses[holderName], 
            totalSupply.mul(restrictedPercents[holderName]).div(1000)
        );
    }
    
    function() external payable {
        createTokens();
    }
}
pragma solidity ^0.4.18;

import './FlipsiToken.sol';
import '../math/SafeMath.sol';

/**
 * @title Pausable
 * @dev Base contract which allows to implement an emergency stop mechanism.
 */
contract Pausable is Ownable {
    
  event Pause();
  
  event Unpause();

  bool public paused = false;

  /**
   * @dev modifier to allow actions only when the contract IS paused
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev modifier to allow actions only when the contract IS NOT paused
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused {
    paused = true;
    Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused {
    paused = false;
    Unpause();
  }
  
}

contract CommonSale is Pausable {

  address public multisigWallet;
  uint public start;
  uint public period;
  uint public minPrice;
  uint public totalTokensMinted;
  uint public totalHardcap;
  uint public totalInvested;

  FlipsiTokenCoin public token;


  modifier saleIsOn() {
    require(now >= start && now < lastSaleDate());
    _;
  }
  
  modifier isUnderHardcap() {
    require(totalInvested <= totalHardcap);
    _;
  }

  // TODO: add require or smth that
  function setStart(uint newStart) public onlyOwner {
    start = newStart;
  }

  function setPeriod(uint newPeriod) public onlyOwner {
    period = newPeriod;
  }
  
  function setMinPrice(uint newMinPrice) public onlyOwner {
    minPrice = newMinPrice;
  }
  
  function setToken(address newToken) public onlyOwner {
    token = FlipsiTokenCoin(newToken);
  }

  function lastSaleDate() public constant returns(uint) {
    return start + period * 1 days;
  }
   
   // TODO: update
  function createTokens() public whenNotPaused payable {
    require(msg.value >= minPrice);
    multisigWallet.transfer(msg.value);
    uint tokens = msg.value.mul(stage.price);
    token.mint(this, tokens);
    token.transfer(msg.sender, tokens);
    totalTokensMinted = totalTokensMinted.add(tokens);
    totalInvested = totalInvested.add(msg.value);
    stage.invested = stage.invested.add(msg.value);
    if(stage.invested >= stage.hardcap) {
      stage.closed = now;
    }
  }

  function() external payable {
    createTokens();
  }
}


contract Presale is CommonSale {

  Mainsale public mainsale;

  function setMainsale(address newMainsale) public onlyOwner {
    mainsale = Mainsale(newMainsale);
  }

  function setMultisigWallet(address newMultisigWallet) public onlyOwner {
    multisigWallet = newMultisigWallet;
  }

  function finishMinting() public whenNotPaused onlyOwner {
    token.setSaleAgent(mainsale);
  }

  function() external payable {
    createTokens();
  }

  function retrieveTokens(address anotherToken) public onlyOwner {
    ERC20 alienToken = ERC20(anotherToken);
    alienToken.transfer(multisigWallet, token.balanceOf(this));
  }

}


contract Mainsale is CommonSale {

  address public foundersTokensWallet;
  
  address public bountyTokensWallet;
  
  uint public foundersTokensPercent;
  
  uint public bountyTokensPercent;
  
  uint public percentRate = 100;

  uint public lockPeriod;

  function setLockPeriod(uint newLockPeriod) public onlyOwner {
    lockPeriod = newLockPeriod;
  }

  function setFoundersTokensPercent(uint newFoundersTokensPercent) public onlyOwner {
    foundersTokensPercent = newFoundersTokensPercent;
  }

  function setBountyTokensPercent(uint newBountyTokensPercent) public onlyOwner {
    bountyTokensPercent = newBountyTokensPercent;
  }

  function setFoundersTokensWallet(address newFoundersTokensWallet) public onlyOwner {
    foundersTokensWallet = newFoundersTokensWallet;
  }

  function setBountyTokensWallet(address newBountyTokensWallet) public onlyOwner {
    bountyTokensWallet = newBountyTokensWallet;
  }

  function finishMinting() public whenNotPaused onlyOwner {
    uint summaryTokensPercent = bountyTokensPercent + foundersTokensPercent;
    uint mintedTokens = token.totalSupply();
    uint summaryFoundersTokens = mintedTokens.mul(summaryTokensPercent).div(percentRate - summaryTokensPercent);
    uint totalSupply = summaryFoundersTokens + mintedTokens;
    uint foundersTokens = totalSupply.mul(foundersTokensPercent).div(percentRate);
    uint bountyTokens = totalSupply.mul(bountyTokensPercent).div(percentRate);
    token.mint(this, foundersTokens);
    token.lock(foundersTokensWallet, lockPeriod * 1 days);
    token.transfer(foundersTokensWallet, foundersTokens);
    token.mint(this, bountyTokens);
    token.transfer(bountyTokensWallet, bountyTokens);
    totalTokensMinted = totalTokensMinted.add(foundersTokens).add(bountyTokens);
    token.finishMinting();
  }

}

contract TestConfigurator is Ownable {

  CovestingToken public token; 

  Presale public presale;

  Mainsale public mainsale;

  function deploy() public onlyOwner {
    token = new CovestingToken();

    presale = new Presale();

    presale.setToken(token);
    presale.addStage(5,300);
    presale.setMultisigWallet(0x055fa3f2DAc0b9Db661A4745965DDD65490d56A8);
    presale.setStart(1507208400);
    presale.setPeriod(2);
    presale.setMinPrice(100000000000000000);
    token.setSaleAgent(presale);	

    mainsale = new Mainsale();

    mainsale.setToken(token);
    mainsale.addStage(1,200);
    mainsale.addStage(2,100);
    mainsale.setMultisigWallet(0x4d9014eF9C3CE5790A326775Bd9F609969d1BF4f);
    mainsale.setFoundersTokensWallet(0x59b398bBED1CC6c82b337B3Bd0ad7e4dCB7d4de3);
    mainsale.setBountyTokensWallet(0x555635F2ea026ab65d7B44526539E0aB3874Ab24);
    mainsale.setStart(1507467600);
    mainsale.setPeriod(2);
    mainsale.setLockPeriod(1);
    mainsale.setMinPrice(100000000000000000);
    mainsale.setFoundersTokensPercent(13);
    mainsale.setBountyTokensPercent(5);

    presale.setMainsale(mainsale);

    token.transferOwnership(owner);
    presale.transferOwnership(owner);
    mainsale.transferOwnership(owner);
  }

}

contract Configurator is Ownable {

  CovestingToken public token; 
  Presale public presale;
  Mainsale public mainsale;

  function deploy() public onlyOwner {
    token = new FlipsiTokenCoin();
    presale = new Presale();
    presale.setToken(token);

    presale.setStart(1508504400); // TODO: add start of presale
    presale.setPeriod(7);
    presale.setMinPrice(100000000000000000);
    token.setSaleAgent(presale);





    mainsale = new Mainsale();

    mainsale.setToken(token);
    mainsale.setFoundersTokensWallet(0x0);
    mainsale.setBountyTokensWallet(0x0);
    mainsale.setStart(1511528400);
    mainsale.setPeriod(7); // days
    mainsale.setLockPeriod(30); // 
    mainsale.setMinPrice(100000000000000000);
    mainsale.setFoundersTokensPercent(13);
    mainsale.setBountyTokensPercent(5);

    presale.setMainsale(mainsale);

    token.transferOwnership(owner);
    presale.transferOwnership(owner);
    mainsale.transferOwnership(owner);
  }

}







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
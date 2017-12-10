pragma solidity ^0.4.18;

import './FlipsiToken.sol';
import '../math/SafeMath.sol';
import './Ownable.sol';
import './Pausable.sol';


contract CommonSale is Pausable {

  address public multisigWallet;
  uint public start;
  uint public period;
  uint public price; 
  uint public minPayment;
  uint public totalSoftcap;
  uint public totalHardcap;
  uint public totalInvested;

  FlipsiTokenCoin public token;


  modifier saleIsOn() {
    require(now >= start && now < lastSaleDate());
    _;
  }

  modifier isAboveSoftcap() {
    require(totalInvested >= totalSoftcap);
    _;
  }
  
  modifier isUnderHardcap() {
    require(totalInvested <= totalHardcap);
    _;
  }
  
  function getBonus(uint tokensAmount) internal constant returns (uint);

  // TODO: add require or smth that
  function setStart(uint newStart) public onlyOwner {
    start = newStart;
  }

  // TODO: add require or smth that
  function setPeriod(uint newPeriod) public onlyOwner {
    period = newPeriod;
  }
  
  function setMinPayment(uint newMinPayment) public onlyOwner {
    minPayment = newMinPayment;
  }
  function setPrice(uint newPrice) public onlyOwner {
    price = newPrice;
  }
  
// TODO remove 
  function setToken(address newToken) public onlyOwner {
    token = FlipsiTokenCoin(newToken);
  }

  function lastSaleDate() public constant returns(uint) {
    return start + period * 1 days;
  }
// TODO to multisigWallet after sale end
  function createTokens() public saleIsOn whenNotPaused payable {
    require(msg.value >= minPayment);
    multisigWallet.transfer(msg.value);
    uint tokens = price.mul(msg.value);
    tokens += getBonus(tokens);
    token.transfer(msg.sender, tokens);
  }

  function() external payable {
    createTokens();
  }
}


contract Presale is CommonSale {

  Mainsale public mainsale;
  bool private restrictedTokensTransfered = false;
  uint8 public bonusPercent;
  mapping(string => address) restrictedAddresses;
  mapping(string => uint) restrictedPercents;

  modifier restrictedNotTransfered() {
    require(!restrictedTokensTransfered);
    _;
  }

  function setMainsale(address newMainsale) public onlyOwner {
    mainsale = Mainsale(newMainsale);
  }

  function setMultisigWallet(address newMultisigWallet) public onlyOwner {
    multisigWallet = newMultisigWallet;
  }

  function finishPresale() public whenNotPaused onlyOwner {
    token.setSaleAgent(mainsale, 20000000*10**8);
  }

  /**
    * Init restricted data, count and transfer tokens to restricted accounts
    */
  function transferAllRestrictedTokens(
    address foundersAddress, uint8 foundersPercent10x,
    address teamAddress, uint8 teamPercent10x,
    address advisorsAddress, uint8 advisorsPercent10x,
    address bountyAddress, uint8 bountyPercent10x,
    address devteamAddress, uint8 devteamPercent10x
  ) public restrictedNotTransfered onlyOwner
    {
      restrictedAddresses["founders"] = foundersAddress;
      restrictedAddresses["team"] = teamAddress;
      restrictedAddresses["advisors"] = advisorsAddress;
      restrictedAddresses["bounty"] = bountyAddress;
      restrictedAddresses["devteam"] = devteamAddress;

      restrictedPercents["founders"] = foundersPercent10x;
      restrictedPercents["team"] = teamPercent10x;
      restrictedPercents["advisors"] = advisorsPercent10x;
      restrictedPercents["bounty"] = bountyPercent10x;
      restrictedPercents["devteam"] = devteamPercent10x;

      uint256 total = token.totalSupply();
      transferRestrictedTokens(total, "founders");
      transferRestrictedTokens(total, "team");
      transferRestrictedTokens(total, "advisors");
      transferRestrictedTokens(total, "bounty");
      transferRestrictedTokens(total, "devteam");
      restrictedTokensTransfered;
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
  
  // TODO bonuses to 10x
  /**
    * Add bonuses for sender regarding bonuses schedule
    * @param tokensAmount - amount of bought tokens without bonuses
    */
  function getBonus(uint tokensAmount) internal constant returns(uint) {    
    return tokensAmount.div(100).mul(bonusPercent);
  }

  function setBonuses(uint8 percent) public onlyOwner {
    bonusPercent = percent;
  }

  function() external payable {
    createTokens();
  }
}

contract Mainsale is CommonSale {
  
  uint public lockPeriod;
  mapping(string => mapping(string => uint)) bonuses;

  function setLockPeriod(uint newLockPeriod) public onlyOwner {
    lockPeriod = newLockPeriod;
  }

  function setBonuses(
    uint8 firstPeriodPercent, uint firstPeriodEndDate,
    uint8 secondPeriodPercent, uint secondPeriodEndDate,
    uint8 thirdPeriodPercent, uint thirdPeriodEndDate,
    uint8 fourthPeriodPercent, uint fourthPeriodEndDate
  ) public onlyOwner 
  {
    bonuses["firstPeriod"]["percent"] = firstPeriodPercent;
    bonuses["firstPeriod"]["endDate"] = firstPeriodEndDate;
    bonuses["secondPeriod"]["percent"] = secondPeriodPercent;
    bonuses["secondPeriod"]["endDate"] = secondPeriodEndDate;
    bonuses["thirdPeriod"]["percent"] = thirdPeriodPercent;
    bonuses["thirdPeriod"]["endDate"] = thirdPeriodEndDate;
    bonuses["fourthPeriod"]["percent"] = fourthPeriodPercent;
    bonuses["fourthPeriod"]["endDate"] = fourthPeriodEndDate;
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
}

contract Configurator is Ownable {

  FlipsiTokenCoin public token; 
  Presale public presale;
  Mainsale public mainsale;

  function deploy() public onlyOwner {
    token = new FlipsiTokenCoin();
    presale = new Presale();
    presale.setToken(token);
    presale.setStart(1516858400); // TODO: update it
    presale.setPeriod(7);
    presale.setPrice(2500000000000000);
    presale.setMinPayment(100000000000000000);
    presale.setBonuses(25);
    token.setSaleAgent(presale,20000000*10**8*10/100);
    presale.transferAllRestrictedTokens(
      0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De, 100, // 10%
      0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De, 100, // 10%
      0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De, 100, // 10%
      0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De, 100,  // 10%
      0xb3eD172CC64839FB0C0Aa06aa129f402e994e7De, 1 // 0.1%
    );

    mainsale = new Mainsale();
    mainsale.setToken(token);
    mainsale.setStart(1516838400); // 2018-01-25T00:00:00+00:00
    mainsale.setPeriod(30);
    mainsale.setLockPeriod(30);
    mainsale.setPrice(2500000000000000);
    mainsale.setMinPayment(100000000000000000);
    mainsale.setBonuses(
      20, 1517443200, // 2018-02-01T00:00:00+00:00
      15, 1518048000, // 2018-02-08T00:00:00+00:00
      10, 1518652800, // 2018-02-15T00:00:00+00:00
      5, 1519257600   // 2018-02-22T00:00:00+00:00
    );

    presale.setMainsale(mainsale);

    token.transferOwnership(owner);
    presale.transferOwnership(owner);
    mainsale.transferOwnership(owner);
  }
}

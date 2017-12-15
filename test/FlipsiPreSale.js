const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiToken = artifacts.require('FlipsiToken');
const FlipsiPreSale = artifacts.require('FlipsiPreSale');
    
contract('FlipsiPreSale', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const BENEFICIARY = accounts[1];
  const TOKENSYMBOL = 'FLP';
  const TOKENDECIMALS = 8;
  const RATE = new web3.BigNumber(1000);
  const PRESALEHARDCAP = new web3.toBigNumber(1000000).mul(web3.toBigNumber(10).pow(TOKENDECIMALS));;
  const DURATION = 2; // in minutes
  const BONUS = 40; // %

  const buyer1 = accounts[2];

    
    //~ var balance = new BigNumber('131242344353464564564574574567456');
    
  let crowdsale;
  let token;
  let currentTime; //in seconds
  //~ let TOTALSUPPLY;
    
  before('setup', () => {
    return FlipsiPreSale.deployed()
    .then(instance => crowdsale = instance)
    .then(() => crowdsale.tokenReward())
    .then((tokenReward) => token = FlipsiToken.at(tokenReward))
    .then(() => currentTime = parseInt((new Date()).valueOf()/1000)) 
    .then(reverter.snapshot);
  });

it('should have correct token after create', () => {
    return Promise.resolve()
    .then(() => token.symbol())
    .then(asserts.equal(TOKENSYMBOL))
  });


it('should have beneficiary after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.beneficiary())
    .then(asserts.equal(BENEFICIARY))
  });

it('should have rate after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.rate())
    .then(asserts.equal(RATE))
  });

it('should have presaleHardcap after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.hardcap())
    .then(asserts.equal(PRESALEHARDCAP))
  });

it('should have startdate less than 60 sec after now', () => {
    return Promise.resolve()
    .then(() => crowdsale.startTime())
    .then((time) => currentTime - time.toNumber() < 60)
    .then(asserts.equal(true))
  });

it('should have enddate less than DURATION-1 min after now', () => {
    return Promise.resolve()
    .then(() => crowdsale.endTime())
    .then((time) => currentTime+DURATION*60-60 < time.toNumber())
    .then(asserts.equal(true))
  });

it('should have enddate more than DURATION+1 min after now', () => {
    return Promise.resolve()
    .then(() => crowdsale.endTime())
    .then((time) => currentTime+DURATION*60+60 > time.toNumber())
    .then(asserts.equal(true))
  });

it('should have tokenSold is zero after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.tokensSold())
    .then(asserts.equal(0))
  });

it('should have minContributionInTokens is 40 after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.minContributionInTokens())
    .then(asserts.equal(40))
  });

it('should have minContribution by RATE after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.minContribution())
    .then(asserts.equal(40*RATE))
  });

it.only('should not paused after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.paused())
    .then(asserts.equal(false))
  });

// PAUSABLE
it.only('should allow pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => crowdsale.paused())
    .then(asserts.equal(true))
   ;
  });

it.only('should emit Pause event on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Pause');
    });
  });

it.only('should fail when not owner on pause', () => {
    return Promise.resolve()
    .then(() => asserts.throws(crowdsale.pause( {from: buyer1})))
  });

it.only('should fail when already paused on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.pause()))
  });

it.only('should allow unpause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => crowdsale.unpause())
    .then(() => crowdsale.paused())
    .then(asserts.equal(false))
   ;
  });

it.only('should emit Unpause event on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => crowdsale.unpause())
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Unpause');
    });
  });

it.only('should fail when not owner on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.unpause( {from: buyer1})))
  });

it.only('should fail when already paused on pause', () => {
    return Promise.resolve()
    .then(() => asserts.throws(crowdsale.unpause()))
    .then(() => crowdsale.pause())
    .then(() => crowdsale.unpause())
    .then(() => asserts.throws(crowdsale.unpause()))
  });


/*it.only('should have presale bonus after create', () => {
    const testValue1 = 1000*40/100;
    const testValue2 = 1000000;
    const testValue3 = PRESALEHARDCAP;
    return Promise.resolve()
    .then(() => crowdsale.getBonus(testValue1))
    .then(asserts.equal(testValue1*40/100))
    .then(() => crowdsale.getBonus(testValue2))
    .then(asserts.equal(testValue2*40/100))
  });
*/


});
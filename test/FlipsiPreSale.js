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
  const MIN_CONTRIBUTION_IN_TOKENS = 40;
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

it.only('should token has crowdsale as agent after create', () => {
    return Promise.resolve()
    .then(() => token.crowdSaleAddr())
    .then(asserts.equal(crowdsale.address))
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
    .then(asserts.equal(MIN_CONTRIBUTION_IN_TOKENS))
  });

it('should have minContribution by RATE after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.minContribution())
    .then(asserts.equal(MIN_CONTRIBUTION_IN_TOKENS*RATE))
  });

it('should not close sale after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.saleClosed())
    .then(asserts.equal(false))
  });

// PAUSABLE
it('should not paused after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.paused())
    .then(asserts.equal(false))
  });

it('should allow pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => crowdsale.paused())
    .then(asserts.equal(true))
   ;
  });

it('should emit Pause event on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Pause');
    });
  });

it('should fail when not owner on pause', () => {
    return Promise.resolve()
    .then(() => asserts.throws(crowdsale.pause( {from: buyer1})))
  });

it('should fail when already paused on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.pause()))
  });

it('should allow unpause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => crowdsale.unpause())
    .then(() => crowdsale.paused())
    .then(asserts.equal(false))
   ;
  });

it('should emit Unpause event on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => crowdsale.unpause())
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Unpause');
    });
  });

it('should fail when not owner on pause', () => {
    return Promise.resolve()
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.unpause( {from: buyer1})))
  });

it('should fail when already paused on pause', () => {
    return Promise.resolve()
    .then(() => asserts.throws(crowdsale.unpause()))
    .then(() => crowdsale.pause())
    .then(() => crowdsale.unpause())
    .then(() => asserts.throws(crowdsale.unpause()))
  });


// FlipsiCrowdsale

it('should allow setRate', () => {
  const newRate = 10000;

    return Promise.resolve()
    .then(() => crowdsale.setRate(newRate))
    .then(() => crowdsale.rate())
    .then(asserts.equal(newRate))
   ;
  });

it('should emit SetRate event on setRate', () => {
    const newRate = 10000

    return Promise.resolve()
    .then(() => crowdsale.setRate(newRate))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'SetRate');
      assert.equal(result.logs[0].args.value.valueOf(), newRate);
    });
  });

it('should change minContribution on setRate', () => {
  const newRate = 10000;

  return Promise.resolve()
    .then(() => crowdsale.setRate(newRate))
    .then(() => crowdsale.minContribution())
    .then(asserts.equal(MIN_CONTRIBUTION_IN_TOKENS*newRate))
   ;
  });

it('should fail when not owner on setRate', () => {
  const newRate = 10000;

  return Promise.resolve()
    .then(() => asserts.throws(crowdsale.setRate(newRate, {from: buyer1})))
  });

// TODO terminate
it('should allow setRate', () => {
  return Promise.resolve()
    .then(() => crowdsale.terminate())
    .then(() => crowdsale.saleClosed())
    .then(asserts.equal(true))
   ;
  });

it('should emit SetRate event on setRate', () => {
  return Promise.resolve()
    .then(() => crowdsale.terminate())
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Terminate');
    });
  });

it('should fail when not owner on setRate', () => {
  return Promise.resolve()
    .then(() => asserts.throws(crowdsale.terminate({from: buyer1})))
  });

// TODO proxyBuy
it.only('should allow proxyBuy', () => {
  const pay = RATE * MIN_CONTRIBUTION_IN_TOKENS;

  return Promise.resolve()
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(0))
    .then(() => crowdsale.proxyBuy(buyer1, pay))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(pay))
    .then(() => crowdsale.proxyBuy(buyer1, RATE * 1000))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(pay + RATE * 1000))
   ;
  });

it.only('should emit ProxyBuy event on proxyBuy', () => {
  const pay = RATE * 130;

    return Promise.resolve()
    .then(() => crowdsale.proxyBuy(buyer1, pay))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'ProxyBuy');
      assert.equal(result.logs[0].args.to, buyer1);
      assert.equal(result.logs[0].args.value.valueOf(), pay);
    });
  });

// TODO send ether
// TODO ownerSafeWithdrawal

/*it('should have presale bonus after create', () => {
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
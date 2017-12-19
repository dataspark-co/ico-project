const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiToken = artifacts.require('FlipsiToken');
const FlipsiPreSale = artifacts.require('FlipsiPreSale');
 
const increaseTime = addSeconds => {
    web3.currentProvider.send({
        jsonrpc: "2.0", 
        method: "evm_increaseTime", 
        params: [addSeconds], id: 0
    })
  }

const mineBlock = () => {
    web3.currentProvider.send({
        jsonrpc: "2.0", 
        method: "evm_mine", 
        params: [], id: 0
    })
  }

contract('FlipsiPreSale', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const BENEFICIARY = accounts[1];
  const TOKENSYMBOL = 'FLP';
  const TOKENDECIMALS = 8;
  const TOTALTOKENS = new web3.toBigNumber(20000000);
  const DECIMALS = web3.toBigNumber(10).pow(TOKENDECIMALS);
  const INITIALSUPPLY = TOTALTOKENS.mul(DECIMALS);
  const RATE = web3.toWei(1/400,'ether')/DECIMALS;
  const MIN_CONTRIBUTION_IN_TOKENS = (new web3.toBigNumber(40)).mul(DECIMALS);
  const MIN_CONTRIBUTION = MIN_CONTRIBUTION_IN_TOKENS.mul(RATE);
  const PRESALE_RATE = 3; // %
  const PRESALEHARDCAP = TOTALTOKENS.mul(3).div(100).mul(DECIMALS);
  const BONUS = 40; // %

  const buyer1 = accounts[2];
  
  const CURRENT_TIME = parseInt((new Date()).valueOf()/1000)-10;
  const DURATION = 2; // in minutes
  const START_DATE = CURRENT_TIME + 60*60;
  const END_DATE = START_DATE + DURATION * 60;

    //~ var balance = new BigNumber('131242344353464564564574574567456');
    
  let crowdsale;
  let token;
  let startTime; //in seconds
  let endTime; //in seconds
  //~ let TOTALSUPPLY;
    
  before('setup', () => {
    return FlipsiPreSale.deployed()
    .then(instance => crowdsale = instance)
    .then(() => crowdsale.tokenReward())
    .then(tokenReward => token = FlipsiToken.at(tokenReward))
    .then(() => crowdsale.startTime())
    .then(time => startTime = time)
    .then(() => crowdsale.endTime())
    .then(time => endTime = time)
    .then(reverter.snapshot)
    ;
  });

  beforeEach(() => {
    mineBlock();
  });

it('should have correct token after create', () => {
    return Promise.resolve()
    .then(() => token.symbol())
    .then(asserts.equal(TOKENSYMBOL))
  });

it('should token has crowdsale as agent after create', () => {
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

it('should have START_DATE less than startTime', () => {
    return Promise.resolve()
    .then(() => crowdsale.startTime())
    .then((time) => START_DATE < time.toNumber())
    .then(asserts.equal(true))
  });

it('should have START_DATE+1 min more than startTime', () => {
    return Promise.resolve()
    .then(() => crowdsale.startTime())
    .then((time) => START_DATE+60 > time.toNumber())
    .then(asserts.equal(true))
  });

it('should have END_DATE less than endTime', () => {
    return Promise.resolve()
    .then(() => crowdsale.endTime())
    .then((time) => END_DATE < time.toNumber())
    .then(asserts.equal(true))
  });

it('should have END_DATE+1 min more than endTime', () => {
    return Promise.resolve()
    .then(() => crowdsale.endTime())
    .then((time) => END_DATE+60 > time.toNumber())
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

// terminate
it('should allow terminate', () => {
  return Promise.resolve()
    .then(() => crowdsale.terminate())
    .then(() => crowdsale.saleClosed())
    .then(asserts.equal(true))
   ;
  });

it('should emit Terminate event on terminate', () => {
  return Promise.resolve()
    .then(() => crowdsale.terminate())
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Terminate');
    });
  });

it('should fail when not owner on terminate', () => {
  return Promise.resolve()
    .then(() => asserts.throws(crowdsale.terminate({from: buyer1})))
  });

// beforeStart
// NOW time
it('should fail for now before startTime on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time < startTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.proxyBuy(buyer1, pay,{from: buyer1})))
  });

it('should fail for now before startTime on send Ether', () => {
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time < startTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.sendTransaction({value:MIN_CONTRIBUTION,from:buyer1})))
  });
// TODO ownerSafeWithdrawal NOW

// BEFORE startTime
it('should fail before startTime on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;

  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => increaseTime(startTime-time-5))
    .then(() => crowdsale.setRate(RATE))
    .then(() => crowdsale.currentTime())
    .then(time => time < startTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.proxyBuy(buyer1, pay,{from: buyer1})))
  });

it('should fail before startTime on send Ether', () => {
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time < startTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.sendTransaction({value:MIN_CONTRIBUTION,from:buyer1})))
  });
// TODO ownerSafeWithdrawal before START

// proxyBuy
it('should allow proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  const pay2 = MIN_CONTRIBUTION_IN_TOKENS * 3;
 
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => increaseTime(startTime-time))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(0))
    .then(() => crowdsale.proxyBuy(buyer1, pay))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(pay*(BONUS+100)/100))
    .then(() => crowdsale.proxyBuy(buyer1, pay2))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal( pay.add(pay2)*(BONUS+100)/100 ))
   ;
  });

it('should emit ProxyBuy event on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS.add(130);

    return Promise.resolve()
    .then(() => crowdsale.proxyBuy(buyer1, pay))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'ProxyBuy');
      assert.equal(result.logs[0].args.to, buyer1);
      assert.equal(result.logs[0].args.value.valueOf(), pay);
    });
  });

it('should change tokensSold on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  const pay2 = MIN_CONTRIBUTION_IN_TOKENS * 2;

  return Promise.resolve()
    .then(() => crowdsale.proxyBuy(buyer1, pay))
    .then(() => crowdsale.tokensSold())
    .then(asserts.equal( pay*(BONUS+100)/100 ))
    .then(() => crowdsale.proxyBuy(buyer1, pay2))
    .then(() => crowdsale.tokensSold())
    .then(asserts.equal( pay.add(pay2)*(BONUS+100)/100 ))
   ;
  });

it('should fail when not owner on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= startTime && time < endTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.proxyBuy(buyer1, pay,{from: buyer1})))
  });

it('should fail when paused on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= startTime && time < endTime)
    .then(asserts.equal( true ))
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.proxyBuy(buyer1, pay)))
  });


it('should fail when saleClosed on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= startTime && time < endTime)
    .then(asserts.equal( true ))
    .then(() => crowdsale.terminate())
    .then(() => asserts.throws(crowdsale.proxyBuy(buyer1, pay)))
  });

// send ether
it('should allow send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(0))
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(amountTokens*(BONUS+100)/100))
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(amountTokens*2*(BONUS+100)/100))
    ;
  });

it('should emit Buy event on send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Buy');
      assert.equal(result.logs[0].args.to, buyer1);
      assert.equal(result.logs[0].args.pay.valueOf(), amount);
      assert.equal(result.logs[0].args.value.valueOf(), amountTokens);
    });
  });

it('should change crowdsale buyer balance on send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => crowdsale.balanceOf(buyer1))
    .then(asserts.equal(amount))
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => crowdsale.balanceOf(buyer1))
    .then(asserts.equal(amount*2))
    ;
  });

it('should change amountRaised on send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => crowdsale.amountRaised())
    .then(asserts.equal(amount))
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => crowdsale.amountRaised())
    .then(asserts.equal(amount*2))
    ;
  });

it('should hange crowdsale buyer balance on send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => web3.eth.getBalance(crowdsale.address))
    .then(asserts.equal(amount))
    ;
  });

it('should MIN_CONTRIBUTION allow send Ether', () => {
  return Promise.resolve()
    .then(() => crowdsale.sendTransaction({value:MIN_CONTRIBUTION,from:buyer1}))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(MIN_CONTRIBUTION_IN_TOKENS*(BONUS+100)/100))
    ;
  });

it('should fail less MIN_CONTRIBUTION on send Ether', () => {
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= startTime && time < endTime)
    .then(asserts.equal( true ))
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.sendTransaction({value:MIN_CONTRIBUTION.add(1),from:buyer1})))
  });

it('should fail when paused on send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= startTime && time < endTime)
    .then(asserts.equal( true ))
    .then(() => crowdsale.pause())
    .then(() => asserts.throws(crowdsale.sendTransaction({value:amount,from:buyer1})))
  });

it('should fail when saleClosed on send Ether', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= startTime && time < endTime)
    .then(asserts.equal( true ))
    .then(() => crowdsale.terminate())
    .then(() => asserts.throws(crowdsale.sendTransaction({value:amount,from:buyer1})))
  });
// TODO ownerSafeWithdrawal after START

// proxyBuy afterEnd
// BEFORE endTime
it('should allow before endTime on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
 
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => increaseTime(endTime-time-5))
    .then(() => crowdsale.proxyBuy(buyer1, pay))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(pay*(BONUS+100)/100))
   ;
  });

it('should allow send Ether before endTime', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => crowdsale.sendTransaction({value:amount,from:buyer1}))
    .then(() => token.balanceOf(buyer1))
    .then(asserts.equal(amountTokens*(BONUS+100)/100))
    ;
  });
// TODO ownerSafeWithdrawal before END

// AFTER endTime
it('should fail after endTime on proxyBuy', () => {
  const pay = MIN_CONTRIBUTION_IN_TOKENS;
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => increaseTime(endTime-time))
    .then(() => mineBlock())
    .then(() => crowdsale.currentTime())
    .then(time => time >= endTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.proxyBuy(buyer1, pay,{from: buyer1})))
  });

it('should fail after endTime on send Ether', () => {
  return Promise.resolve()
    .then(() => crowdsale.currentTime())
    .then(time => time >= endTime)
    .then(asserts.equal( true ))
    .then(() => asserts.throws(crowdsale.sendTransaction({value:MIN_CONTRIBUTION,from:buyer1})))
  });

it.only('should allow safeWithdrawal after endTime', () => {
  var amount;

  return Promise.resolve()
    .then(() => web3.eth.getBalance(BENEFICIARY))
    .then(asserts.equal(0))
    .then(() => web3.eth.getBalance(crowdsale.address))
    .then(_amount => amount = _amount)
    .then(() => crowdsale.ownerSafeWithdrawal({value:amount,from:buyer1}))
    .then(() => token.getBalance(BENEFICIARY))
    .then(asserts.equal(amount))
    .then(() => web3.eth.getBalance(crowdsale.address))
    .then(asserts.equal(0))
    ;
  });

// TODO ownerSafeWithdrawal
it.only('should allow ownerSafeWithdrawal endTime', () => {
  const amount = web3.toWei(1.0, 'ether');
  const amountTokens = amount / RATE;

  return Promise.resolve()
    .then(() => web3.eth.getBalance(crowdsale.address))
    .then(() => asserts.equal(0))
    // .then(() => crowdsale.ownerSafeWithdrawal())
    // .then(() => token.balanceOf(buyer1))
    // .then(asserts.equal(amountTokens*(BONUS+100)/100))
    ;
  });


});
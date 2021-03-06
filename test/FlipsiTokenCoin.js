const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiToken = artifacts.require('FlipsiToken');
    
contract('FlipsiToken', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const tokenHolder = OWNER;
  const holder1 = accounts[1];
  const holder2 = accounts[2];
  const holder3 = accounts[3];
  const agentAcc = accounts[9];
  const bountyAcc = accounts[8];
  const foundersAcc = accounts[7];
  const teamAcc = accounts[6];
  const devteamAcc = accounts[5];

    //~ const TOTALSUPPLY = parseInt(web3.toWei(20000000));
  const TOKENNAME = "Flipsi Token";
  const TOKENSYMBOL = "FLP";
  const TOTALTOKENS = 20000000;
  const TOKENDECIMALS = 8;
  const TOTALSUPPLY = web3.toBigNumber(TOTALTOKENS).mul(web3.toBigNumber(10).pow(TOKENDECIMALS)) 
  const CROWDSALEALLOWANCE = TOTALSUPPLY.mul(60).div(100);
  const BOUNTYALLOWANCE = TOTALSUPPLY.mul(5).div(100);

  const FOUNDERS_RATE = 100; // 10x %
  const TEAM_RATE = 100; // 10x %
  const DEVTEAM_RATE = 5; // 10x %
  
  const OWNER_BALANCE = TOTALSUPPLY.mul(1000-FOUNDERS_RATE-TEAM_RATE-DEVTEAM_RATE).div(1000);
  
    //~ var balance = new BigNumber('131242344353464564564574574567456');
    
  let token;
  //~ let TOTALSUPPLY;
    
  before('setup', () => {
    return FlipsiToken.deployed()
    .then(instance => token = instance)
    .then(() => token.decimals())
    .then(reverter.snapshot);
  });

  // ERC179
  it('should have totalSupply after create', () => {
    return Promise.resolve()
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
  });

  it('should totalSupply without accrual on owner balance after create', () => {
    return Promise.resolve()
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(OWNER_BALANCE))
    ;
  });

  it('should allow on transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.balanceOf(holder1))
    .then(asserts.equal(value))
    ;
  });

  it('should sub balance of sender on transfer', () => {
    const value = 1000;
  
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(OWNER_BALANCE.sub(value)))
    ;
  });
  
  it('should emit Transfer event on transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, OWNER);
      assert.equal(result.logs[0].args.to, holder1);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should totalSupply not changed on transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
    ;
  });

  it('should fail on over TOTALSUPPLY balance on transfer', () => {
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.transfer(holder1, OWNER_BALANCE.add(1), {from: OWNER})))
    ;
  });
  
  it('should fail on empty balance on transfer', () => {
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.transfer(holder2, 1, {from: holder1})))
    ;
  });
 
  it('should fail on send ether to token', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.send(1)))
    ;
  });

  // ERC20
  it('should allow spender on approve', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.allowance(holder1, holder2))
    .then(asserts.equal(0))
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => token.allowance(holder1, holder2))
    .then(asserts.equal(value))
    ;
  });
  
  it('should emit Approval event on approve', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Approval');
      assert.equal(result.logs[0].args.owner, holder1);
      assert.equal(result.logs[0].args.spender, holder2);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should allow reset allowance on approve', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => token.approve(holder2, 0, {from: holder1}))
    .then(() => token.allowance(holder1, holder2))
    .then(asserts.equal(0))
    ;
  });

  it('should fail not empty allowance on approve', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => asserts.throws(token.approve(holder2, value, {from: holder1})))
    ;
  });
  
  it('should allow transfer on transferFrom', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => token.transferFrom(holder1, holder3, value, {from: holder2}))
    .then(() => token.balanceOf(holder3))
    .then(asserts.equal(value))
    ;
  });
  
  it('should sub balance of allowed on transferFrom', () => {
    const value = 2000;
    const transferValue = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => token.transferFrom(holder1, holder3, transferValue, {from: holder2}))
    .then(() => token.balanceOf(holder1))
    .then(asserts.equal(value-transferValue))
    ;
  });
  
  it('should sub allowanceValue on transferFrom', () => {
    const value = 2000;
    const allowanceValue = 1000;
    const transferValue = 700;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, allowanceValue, {from: holder1}))
    .then(() => token.transferFrom(holder1, holder3, transferValue, {from: holder2}))
    .then(() => token.allowance(holder1, holder2))
    .then(asserts.equal(allowanceValue-transferValue))
    ;
  });
  
  it('should emit Transfer event on transferFrom', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => token.transferFrom(holder1, holder3, value, {from: holder2}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Transfer');
      assert.equal(result.logs[0].args.from, holder1);
      assert.equal(result.logs[0].args.to, holder3);
      assert.equal(result.logs[0].args.value.valueOf(), value);
    });
  });

  it('should totalSupply not changed on transferFrom', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => token.transferFrom(holder1, holder3, value, {from: holder2}))
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
    ;
  });

  it('should fail on over sender balance on transferFrom', () => {
    const value = 1000;
    const allowanceValue = 2000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, allowanceValue, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, value+1, {from: holder2})))
    ;
  });
  
  it('should fail on empty balance on transferFrom', () => {
    const value = 1;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, value, {from: holder2})))
    ;
  });
  
  it('should fail on over allowance value on transferFrom', () => {
    const value = 2000;
    const allowanceValue = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, allowanceValue, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, allowanceValue+1, {from: holder2})))
    ;
  });

  it('should fail if not allowed on transferFrom', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, value, {from: holder3})))
    ;
  });

// Ownable
  it('should allow change owner on transferOwnership', () => {
    return Promise.resolve()
    .then(() => token.owner())
    .then(asserts.equal(OWNER))
    .then(() => token.transferOwnership(holder1, {from: OWNER}))
    .then(() => token.owner())
    .then(asserts.equal(holder1))
    ;
  });
  
  it('should emit OwnershipTransferred event on transferOwnership', () => {
    return Promise.resolve()
    .then(() => token.transferOwnership(holder1, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 2);
      assert.equal(result.logs[1].event, 'OwnershipTransferred');
      assert.equal(result.logs[1].args.previousOwner, OWNER);
      assert.equal(result.logs[1].args.newOwner, holder1);
    });
    ;
  });
  
  it('should fail if not owner on transferOwnership', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => asserts.throws(token.transferOwnership(holder1, {from: holder2})))
    ;
  });
  
// BurnableToken
  //~ it('should allow burn on burn', () => {
    //~ const value = 2000;
    //~ const burnValue = 1000;
    //~ return Promise.resolve()
    //~ .then(() => token.enableTransfer())
    //~ .then(() => token.transfer(holder1, value, {from: OWNER}))
    //~ .then(() => token.burn(burnValue, {from: holder1}))
    //~ .then(() => token.balanceOf(holder1))
    //~ .then(asserts.equal(value-burnValue))
    //~ ;
  //~ });
  
  //~ it('should change totalSupply on burn', () => {
    //~ const value = 2000;
    //~ const burnValue = 1000;
    //~ return Promise.resolve()
    //~ .then(() => token.enableTransfer())
    //~ .then(() => token.transfer(holder1, value, {from: OWNER}))
    //~ .then(() => token.burn(burnValue, {from: holder1}))
    //~ .then(() => token.totalSupply())
    //~ .then(asserts.equal(TOTALSUPPLY.sub(burnValue)))
    //~ ;
  //~ });
  
  //~ it('should emit Burn event on burn', () => {
    //~ const value = 2000;
    //~ const burnValue = 1000;
    //~ return Promise.resolve()
    //~ .then(() => token.enableTransfer())
    //~ .then(() => token.transfer(holder1, value, {from: OWNER}))
    //~ .then(() => token.burn(burnValue, {from: holder1}))
    //~ .then(result => {
      //~ assert.equal(result.logs.length, 1);
      //~ assert.equal(result.logs[0].event, 'Burn');
      //~ assert.equal(result.logs[0].args.burner, holder1);
      //~ assert.equal(result.logs[0].args.value.valueOf(), burnValue);
    //~ });
  //~ });

  it('should allow owner burn when transfer disabled on burn', () => {
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.burn(burnValue, {from: OWNER}))
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(OWNER_BALANCE.sub(burnValue)))
    ;
  });
  
  it('should change totalSupply owner burn when transfer disabled on burn', () => {
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.burn(burnValue, {from: OWNER}))
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY.sub(burnValue)))
    ;
  });

  it('should emit Burn event owner when transfer disabled on burn', () => {
    const value = 2000;
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.burn(burnValue, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Burn');
      assert.equal(result.logs[0].args.burner, OWNER);
      assert.equal(result.logs[0].args.value.valueOf(), burnValue);
    });
  });

  it('should allow owner burn when transfer enabled on burn', () => {
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.burn(burnValue, {from: OWNER}))
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(OWNER_BALANCE.sub(burnValue)))
    ;
  });
  
  it('should change totalSupply owner burn when transfer enabled on burn', () => {
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.burn(burnValue, {from: OWNER}))
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY.sub(burnValue)))
    ;
  });

  it('should emit Burn event owner when transfer enabled on burn', () => {
    const value = 2000;
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => token.burn(burnValue, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Burn');
      assert.equal(result.logs[0].args.burner, OWNER);
      assert.equal(result.logs[0].args.value.valueOf(), burnValue);
    });
  });

  it('should fail burn zero on burn', () => {
    const burnValue = 0;
    return Promise.resolve()
    .then(() => asserts.throws(token.burn(burnValue, {from: OWNER})))
    ;
  });
  
  it('should fail burn zero when transfer enabled on burn', () => {
    const burnValue = 0;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.burn(burnValue, {from: OWNER})))
    ;
  });
  
  //~ it('should fail burn above balance on burn', () => {
    //~ const value = 1000;
    //~ const burnValue = 2000;
    //~ return Promise.resolve()
    //~ .then(() => token.transfer(holder1, value, {from: OWNER}))
    //~ .then(() => asserts.throws(token.burn(burnValue, {from: holder1})))
    //~ ;
  //~ });
  
  //~ it('should fail burn above balance transfer enabled on burn', () => {
    //~ const value = 1000;
    //~ const burnValue = 2000;
    //~ return Promise.resolve()
    //~ .then(() => token.enableTransfer())
    //~ .then(() => token.transfer(holder1, value, {from: OWNER}))
    //~ .then(() => asserts.throws(token.burn(burnValue, {from: holder1})))
    //~ ;
  //~ });
  
  it('should fail owner burn above balance on burn', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.burn(OWNER_BALANCE.add(1), {from: OWNER})))
    ;
  });

  it('should fail owner burn above balance transfer enabled on burn', () => {
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.burn(OWNER_BALANCE.add(1), {from: OWNER})))
    ;
  });


  // FlipsiToken
  it('should have name, symbol and decimals', () => {
    return Promise.resolve()
    .then(() => token.name())
    .then(asserts.equal(TOKENNAME))
    .then(() => token.symbol())
    .then(asserts.equal(TOKENSYMBOL))
    .then(() => token.decimals())
    .then(asserts.equal(TOKENDECIMALS))
    ;
  });

  it('should have accrual for founders', () => {
    return Promise.resolve()
    .then(() => token.balanceOf(foundersAcc))
    .then(asserts.equal(TOTALSUPPLY.mul(FOUNDERS_RATE).div(1000)))
    ;
  });

  it('should have accrual for team', () => {
    return Promise.resolve()
    .then(() => token.balanceOf(teamAcc))
    .then(asserts.equal(TOTALSUPPLY.mul(TEAM_RATE).div(1000)))
    ;
  });

  it('should have accrual for devteam', () => {
    return Promise.resolve()
    .then(() => token.balanceOf(devteamAcc))
    .then(asserts.equal(TOTALSUPPLY.mul(DEVTEAM_RATE).div(1000)))
    ;
  });

  it('should allow on setSaleAgent', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.crowdSaleAddr())
    .then(asserts.equal(0))
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.crowdSaleAddr())
    .then(asserts.equal(agentAcc))
    ;
  });

  it('should set allowance to SaleAgent on setSaleAgent', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.allowance(OWNER, agentAcc))
    .then(asserts.equal(value))
    ;
  });
  
  it('should emit SetSaleAgent on setSaleAgent', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'SetSaleAgent');
      assert.equal(result.logs[2].args.agent, agentAcc);
      assert.equal(result.logs[2].args.value.valueOf(), value);
    });
  });

  it('should allow crowdSaleAllowance 60% of TOTALSUPPLY on setSaleAgent', () => {
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, CROWDSALEALLOWANCE, {from: OWNER}))
    .then(() => token.allowance(OWNER, agentAcc))
    .then(asserts.equal(CROWDSALEALLOWANCE))
    ;
  });
  
  it('should set max amount on setSaleAgent', () => {
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, 0, {from: OWNER}))
    .then(() => token.allowance(OWNER, agentAcc))
    .then(asserts.equal(CROWDSALEALLOWANCE))
    ;
  });
  
  it('should emit SetSaleAgent when set max amount on setSaleAgent', () => {
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, 0, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'SetSaleAgent');
      assert.equal(result.logs[2].args.agent, agentAcc);
      assert.equal(result.logs[2].args.value.valueOf(), CROWDSALEALLOWANCE);
    });
  });

  it('should fail when amountForSale more then crowdSaleAllowance on setSaleAgent', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.setSaleAgent(agentAcc, CROWDSALEALLOWANCE.add(1), {from: OWNER})))
    ;
  });
  
  it('should allow change SaleAgent on setSaleAgent', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(holder1, value, {from: OWNER}))
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.crowdSaleAddr())
    .then(asserts.equal(agentAcc))
    ;
  });

  it('should allow reset old saleAgent allowance when change SaleAgent on setSaleAgent', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.setSaleAgent(holder1, value, {from: OWNER}))
    .then(() => token.allowance(OWNER, agentAcc))
    .then(asserts.equal(0))
    ;
  });
  
  it('should fail not owner on setSaleAgent', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => asserts.throws(token.setSaleAgent(agentAcc, value, {from: holder2})))
    ;
  });
  
  it('should fail when transfer enabled on setSaleAgent', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.setSaleAgent(agentAcc, value, {from: OWNER})))
    ;
  });
  
  it('should allow on setBountyAdminAddr', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.bountyAddr())
    .then(asserts.equal(0))
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.bountyAddr())
    .then(asserts.equal(bountyAcc))
    ;
  });

  it('should set allowance to bountyAddr on setBountyAdminAddr', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.allowance(OWNER, bountyAcc))
    .then(asserts.equal(value))
    ;
  });
  
  it('should emit SetBountyAdminAddr on setBountyAdminAddr', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'SetBountyAdminAddr');
      assert.equal(result.logs[2].args.admin, bountyAcc);
      assert.equal(result.logs[2].args.value.valueOf(), value);
    });
  });

  it('should allow BOUNTYALLOWANCE on setBountyAdminAddr', () => {
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, BOUNTYALLOWANCE, {from: OWNER}))
    .then(() => token.allowance(OWNER, bountyAcc))
    .then(asserts.equal(BOUNTYALLOWANCE))
    ;
  });
  
  it('should set max amount on setBountyAdminAddr', () => {
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, 0, {from: OWNER}))
    .then(() => token.allowance(OWNER, bountyAcc))
    .then(asserts.equal(BOUNTYALLOWANCE))
    ;
  });
  
  it('should emit SetBountyAdminAddr when set max amount on setBountyAdminAddr', () => {
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, 0, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'SetBountyAdminAddr');
      assert.equal(result.logs[2].args.admin, bountyAcc);
      assert.equal(result.logs[2].args.value.valueOf(), BOUNTYALLOWANCE);
    });
  });

  it('should fail when amountForSale more than bountyAllowance on setBountyAdminAddr', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.setBountyAdminAddr(bountyAcc, BOUNTYALLOWANCE.add(1), {from: OWNER})))
    ;
  });
  
  it('should allow change BountyAdminAddr on setBountyAdminAddr', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(holder1, value, {from: OWNER}))
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.bountyAddr())
    .then(asserts.equal(bountyAcc))
    ;
  });

  it('should allow reset old BountyAdminAddr allowance when change BountyAdmin on setBountyAdminAddr', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.setBountyAdminAddr(holder1, value, {from: OWNER}))
    .then(() => token.allowance(OWNER, bountyAcc))
    .then(asserts.equal(0))
    ;
  });
  
  it('should fail not owner on setBountyAdminAddr', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => asserts.throws(token.setBountyAdminAddr(bountyAcc, value, {from: holder2})))
    ;
  });
  
  it('should fail when transfer enabled on setBountyAdminAddr', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.setBountyAdminAddr(bountyAcc, value, {from: OWNER})))
    ;
  });
  
  it('should allow on enableTransfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.transferEnabled())
    .then(asserts.equal(false))
    .then(() => token.enableTransfer({from: OWNER}))
    .then(() => token.transferEnabled())
    .then(asserts.equal(true))
    ;
  });

  it('should fail not owner on enableTransfer', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => asserts.throws(token.enableTransfer({from: holder2})))
    ;
  });
  
  it('should reset saleAgent on enableTransfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.enableTransfer({from: OWNER}))
    .then(() => token.allowance(OWNER, agentAcc))
    .then(asserts.equal(0))
    ;
  });

  it('should reset BountyAdminAddr on enableTransfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.enableTransfer({from: OWNER}))
    .then(() => token.allowance(OWNER, bountyAcc))
    .then(asserts.equal(0))
    ;
  });

  it('should emit AllowTransfer on enableTransfer', () => {
    return Promise.resolve()
    .then(() => token.enableTransfer({from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 3);
      assert.equal(result.logs[2].event, 'AllowTransfer');
    });
  });

  it('should change owner balance on transferOwnership', () => {
    const NEWOWNER = holder3;
    return Promise.resolve()
    .then(() => token.transferOwnership(NEWOWNER,{from: OWNER}))
    .then(() => token.balanceOf(NEWOWNER))
    .then(asserts.equal(OWNER_BALANCE))
  });
  
  it('should change agent allowance on transferOwnership', () => {
    const NEWOWNER = holder3;
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value,{from: OWNER}))
    .then(() => token.allowance(NEWOWNER,agentAcc))
    .then(asserts.equal(0))
    .then(() => token.transferOwnership(NEWOWNER,{from: OWNER}))
    .then(() => token.allowance(NEWOWNER,agentAcc))
    .then(asserts.equal(value))
  });
  
  it('should zero old owner agent allowance on transferOwnership', () => {
    const NEWOWNER = holder3;
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value,{from: OWNER}))
    .then(() => token.allowance(OWNER,agentAcc))
    .then(asserts.equal(value))
    .then(() => token.transferOwnership(NEWOWNER,{from: OWNER}))
    .then(() => token.allowance(OWNER,agentAcc))
    .then(asserts.equal(0))
  });
  
  it('should change bountyAdmin allowance on transferOwnership', () => {
    const NEWOWNER = holder3;
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value,{from: OWNER}))
    .then(() => token.allowance(NEWOWNER,bountyAcc))
    .then(asserts.equal(0))
    .then(() => token.transferOwnership(NEWOWNER,{from: OWNER}))
    .then(() => token.allowance(NEWOWNER,bountyAcc))
    .then(asserts.equal(value))
  });
  
  it('should zero old owner bountyAdmin allowance on transferOwnership', () => {
    const NEWOWNER = holder3;
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value,{from: OWNER}))
    .then(() => token.allowance(OWNER,bountyAcc))
    .then(asserts.equal(value))
    .then(() => token.transferOwnership(NEWOWNER,{from: OWNER}))
    .then(() => token.allowance(OWNER,bountyAcc))
    .then(asserts.equal(0))
  });
  
  it('should allow agent when transfer disabled on transferFrom', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: agentAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    ;
  });
  
  it('should allow bauntyAdmin when transfer disabled on transferFrom', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: bountyAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    ;
  });
  
  it('state:transferDisabled | what:transferFrom | who:owner | from:not owner | should fail', () => {
    const value = 2000;
    const tranferValue = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: agentAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    .then(() => token.approve(OWNER,value,{from: holder2}))
    .then(() => asserts.throws(token.transferFrom(holder2, holder3, tranferValue,{from: OWNER})))
    ;
  });
  
  it('state:transferDisabled | what:transferFrom | who:agent | from:not owner | should fail', () => {
    const value = 2000;
    const tranferValue = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: agentAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    .then(() => token.approve(agentAcc,value,{from: holder2}))
    .then(() => asserts.throws(token.transferFrom(holder2, holder3, tranferValue,{from: agentAcc})))
    ;
  });
  
  it('state:transferDisabled | what:transferFrom | who:bountyAdmin | from:not owner | should fail', () => {
    const value = 2000;
    const tranferValue = 1000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: bountyAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    .then(() => token.approve(bountyAcc,value,{from: holder2}))
    .then(() => asserts.throws(token.transferFrom(holder2, holder3, tranferValue,{from: bountyAcc})))
    ;
  });
  
  it('should allow agent when transfer disabled after change owner on transferFrom', () => {
    const value = 2000;
    const NEWOWNER = holder3;
    return Promise.resolve()
    .then(() => token.transferOwnership(NEWOWNER))
    .then(() => token.setSaleAgent(agentAcc, value, {from: NEWOWNER}))
    .then(() => token.transferFrom(NEWOWNER, holder2, value, {from: agentAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    ;
  });
  
  it('state:transferDisabled | what:transferFrom | who:agent | from:oldOwner | should fail', () => {
    const value = 2000;
    const NEWOWNER = holder3;
    return Promise.resolve()
    .then(() => token.transferOwnership(NEWOWNER))
    .then(() => token.setSaleAgent(agentAcc, value, {from: NEWOWNER}))
    .then(() => asserts.throws(token.transferFrom(OWNER, holder2, value, {from: agentAcc})))
    ;
  });
  
  it('should allow bauntyAdmin when transfer disabled after change owner on transferFrom', () => {
    const value = 2000;
    const NEWOWNER = holder3;
    return Promise.resolve()
    .then(() => token.transferOwnership(NEWOWNER))
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: NEWOWNER}))
    .then(() => token.transferFrom(NEWOWNER, holder2, value, {from: bountyAcc}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(value))
    ;
  });
  
  it('state:transferDisabled | what:transferFrom | who:bauntyAdmin | from:oldOwner | should fail', () => {
    const value = 2000;
    const NEWOWNER = holder3;
    return Promise.resolve()
    .then(() => token.transferOwnership(NEWOWNER))
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: NEWOWNER}))
    .then(() => asserts.throws(token.transferFrom(OWNER, holder2, value, {from: bountyAcc})))
    ;
  });
  
  it('should fail on owner transfer', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => asserts.throws(token.transfer(holder1, value,{from: OWNER})))
    ;
  });
    
  it('should fail on agent transfer', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, agentAcc, value, {from: agentAcc}))
    .then(() => asserts.throws(token.transfer(holder2, value,{from: agentAcc})))
    ;
  });
    
  it('should fail on bountyAdmin transfer', () => {
    const value = 2000;
    return Promise.resolve()
    .then(() => token.setBountyAdminAddr(bountyAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, bountyAcc, value, {from: bountyAcc}))
    .then(() => asserts.throws(token.transfer(holder2, value,{from: bountyAcc})))
    ;
  });
    
  it('state:transferDisabled | what:burn | who:not owner  | should fail', () => {
    const value = 2000;
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: agentAcc}))
    .then(() => asserts.throws(token.burn(burnValue,{from: holder2})))
    ;
  });
  
  it('state:transferEnabled | what:burn | who:not owner  | should fail', () => {
    const value = 2000;
    const burnValue = 1000;
    return Promise.resolve()
    .then(() => token.setSaleAgent(agentAcc, value, {from: OWNER}))
    .then(() => token.transferFrom(OWNER, holder2, value, {from: agentAcc}))
    .then(() => token.enableTransfer())
    .then(() => asserts.throws(token.burn(burnValue,{from: holder2})))
    ;
  });
  
});
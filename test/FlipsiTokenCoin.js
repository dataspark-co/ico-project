const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiTokenCoin = artifacts.require('FlipsiTokenCoin');
    
contract('FlipsiTokenCoin', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const holder1 = accounts[1];
  const holder2 = accounts[2];
  const holder3 = accounts[3];
  //~ const TOTALSUPPLY = parseInt(web3.toWei(20000000));
  const TOKENNAME = "Flipsi Token";
  const TOKENSYMBOL = "FLP";
  const TOTALTOKENS = 20000000;
  const TOKENDECIMALS = 8;
  const TOTALSUPPLY = web3.toBigNumber(TOTALTOKENS).mul(web3.toBigNumber(10).pow(TOKENDECIMALS)) 
    //~ var balance = new BigNumber('131242344353464564564574574567456');
    
  let token;
  //~ let TOTALSUPPLY;
    
  before('setup', () => {
    return FlipsiTokenCoin.deployed()
    .then(instance => token = instance)
    .then(() => token.decimals())
    //~ .then(decimals => TOTALSUPPLY = web3.toBigNumber(TOTALTOKENS).mul(web3.toBigNumber(10).pow(decimals)) )//* math.pow(10,token.decimals()
    //~ .then(decimals => )
    .then(reverter.snapshot);
  });

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
  
  // ERC179
  it('should have totalSupply after create', () => {
    return Promise.resolve()
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
  });

  it('should totalSupply on owner balance after create', () => {
    return Promise.resolve()
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(TOTALSUPPLY))
    ;
  });

  it('should allow on transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.balanceOf(holder1))
    .then(asserts.equal(value))
    ;
  });

  it('should sub balance of sender on transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(TOTALSUPPLY.sub(value)))
    ;
  });
  
  it('should emit Transfer event on transfer', () => {
    const value = 1000;
    return Promise.resolve()
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
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
    ;
  });

  it('should fail on over TOTALSUPPLY balance on transfer', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.transfer(holder1, TOTALSUPPLY.add(1), {from: OWNER})))
    ;
  });
  
  it('should fail on empty balance on transfer', () => {
    return Promise.resolve()
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
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, allowanceValue, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, value+1, {from: holder2})))
    ;
  });
  
  it('should fail on empty balance on transferFrom', () => {
    const value = 1;
    return Promise.resolve()
    .then(() => token.approve(holder2, value, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, value, {from: holder2})))
    ;
  });
  
  it('should fail on over allowance value on transferFrom', () => {
    const value = 2000;
    const allowanceValue = 1000;
    return Promise.resolve()
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.approve(holder2, allowanceValue, {from: holder1}))
    .then(() => asserts.throws(token.transferFrom(holder1, holder3, allowanceValue+1, {from: holder2})))
    ;
  });
  
});
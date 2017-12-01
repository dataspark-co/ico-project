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

  it('should allow to transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.balanceOf(holder1))
    .then(asserts.equal(value))
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

  it('should totalSupply not changed to transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
    ;
  });
  
  it('should owner balance changed to transfer', () => {
    const value = 1000;
    return Promise.resolve()
    .then(() => token.transfer(holder1, value, {from: OWNER}))
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(TOTALSUPPLY-value))
    ;
  });

  it('should fail on over TOTALSUPPLY balance when transfer', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.transfer(holder1, TOTALSUPPLY.add(1), {from: OWNER})))
    ;
  });
  
  it('should fail on empty balance when transfer', () => {
    return Promise.resolve()
    .then(() => asserts.throws(token.transfer(holder2, 1, {from: holder1})))
    ;
  });
 
  
});
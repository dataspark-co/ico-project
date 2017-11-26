const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const SimpleTockenCoin = artifacts.require('./SimpleTokenCoin.sol');

contract('MintableToken', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  let token;

  before('setup', () => {
    return SimpleTockenCoin.deployed()
    .then(instance => token = instance)
    .then(reverter.snapshot);
  });

  it('should check name', () => {
    return Promise.resolve()
    .then(() => token.name())
    .then(asserts.equal("Simple Coint Token"))
    .then(() => token.symbol())
    .then(asserts.equal("SCT"))
    ;
  });

  it('should change mintingFinished to finishMinting', () => {
    const holder = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => token.mintingFinished())
    .then(asserts.equal(false))
    .then(() => token.finishMinting({from: OWNER}))
    .then(() => token.mintingFinished())
    .then(asserts.equal(true))
    ;
  });

  it('should emit MintFinished event on finishMinting', () => {
    return Promise.resolve()
    .then(() => token.finishMinting({from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'MintFinished');
    });
  });
  
  it('should fail not OWNER on finishMinting', () => {
    const holder1 = accounts[3];
    return Promise.resolve()
    .then(() => asserts.throws(token.finishMinting({from: holder1})));
  });

  it('should allow to mint', () => {
    const holder = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => token.balanceOf(holder))
    .then(asserts.equal(0))
    .then(() => token.mint(holder, amount, {from: OWNER}))
    .then(() => token.balanceOf(holder))
    .then(asserts.equal(amount))
    ;
  });

  it('should totalSupply changed to mint', () => {
    const holder1 = accounts[3];
    const holder2 = accounts[4];
    const amount = 1000;
    return Promise.resolve()
    .then(() => token.mint(holder1, amount, {from: OWNER}))
    .then(() => token.mint(holder2, amount+1, {from: OWNER}))
    .then(() => token.totalSupply())
    .then(asserts.equal(amount*2+1))
    ;
  });

  it('should emit Mint event on mint', () => {
    const holder1 = accounts[3];
    const amount = 1000;
    return Promise.resolve()
    .then(() => token.mint(holder1,amount, {from: OWNER}))
    .then(result => {
      assert.equal(result.logs.length, 1);
      assert.equal(result.logs[0].event, 'Mint');
      assert.equal(result.logs[0].args.to, holder1);
      assert.equal(result.logs[0].args.amount.valueOf(), amount);
    });
  });
  
    it('should fail on overflow balance when mint', () => {
    const holder = accounts[3];
    const amount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => token.mint(holder, amount, {from: OWNER}))
    .then(() => asserts.throws(token.mint(holder, 1, {from: OWNER})))
    ;
  });

    it('should fail on overflow totalSupply when mint', () => {
    const holder1 = accounts[3];
    const holder2 = accounts[4];
    const amount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    return Promise.resolve()
    .then(() => token.mint(holder1, amount, {from: OWNER}))
    .then(() => asserts.throws(token.mint(holder2, 1, {from: OWNER})))
    ;
  });

  it('should fail not OWNER on mint', () => {
    const holder1 = accounts[3];
    const holder2 = accounts[4];
    const amount = 1000;
    return Promise.resolve()
    .then(() => asserts.throws(token.mint(holder1, amount, {from: holder2})));
  });

  it('should fail after Finish on mint', () => {
    const holder1 = accounts[3];
    const holder2 = accounts[4];
    const amount = 1000;
    return Promise.resolve()
    .then(() => token.mint(holder1,amount, {from: OWNER}))
    .then(() => token.finishMinting({from: OWNER}))
    .then(() => asserts.throws(token.mint(holder2, amount, {from: OWNER})));
  });

  it('should allow to transfer', () => {
    const holder1 = accounts[3];
    const holder2 = accounts[4];
    const amount = 1000;
    const transferAmount = 300;
    return Promise.resolve()
    .then(() => token.mint(holder1, amount, {from: OWNER}))
    .then(() => token.transfer(holder2, transferAmount, {from: holder1}))
    .then(() => token.balanceOf(holder2))
    .then(asserts.equal(transferAmount))
    ;
  });


});

const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiTokenCoin = artifacts.require('FlipsiTokenCoin');

contract('FlipsiTokenCoin', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const investor1 = accounts[1];
  const investor2 = accounts[2];
    
  let token;

  before('setup', () => {
    return FlipsiTokenCoin.deployed()
    .then(instance => token = instance)
    .then(reverter.snapshot);
  });

  it('should have name, symbol and decimals', () => {
    return Promise.resolve()
    .then(() => token.name())
    .then(asserts.equal("Flipsi Token"))
    .then(() => token.symbol())
    .then(asserts.equal("FLP"))
    .then(() => token.decimals())
    .then(asserts.equal(8))
    ;
  });
  
  it('should have initial mint', () => {
    const value = parseInt(web3.toWei(20000000));
    return Promise.resolve()
    .then(() => token.totalSupply())
    .then(asserts.equal(value))
    .then(() => token.balanceOf(OWNER))
    .then(asserts.equal(value));
  });
  
});
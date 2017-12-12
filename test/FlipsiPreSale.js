const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiPreSale = artifacts.require('FlipsiPreSale');
    
contract('FlipsiPreSale', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const beneficiary = accounts[9];

    
    //~ var balance = new BigNumber('131242344353464564564574574567456');
    
  let crowdsale;
  //~ let TOTALSUPPLY;
    
  before('setup', () => {
    return FlipsiPreSale.deployed()
    .then(instance => crowdsale = instance)
    .then(() => crowdsale.decimals())
    //~ .then(decimals => TOTALSUPPLY = web3.toBigNumber(TOTALTOKENS).mul(web3.toBigNumber(10).pow(decimals)) )//* math.pow(10,token.decimals()
    //~ .then(decimals => )
    .then(reverter.snapshot);
  });

it('should have totalSupply after create', () => {
    return Promise.resolve()
    .then(() => token.totalSupply())
    .then(asserts.equal(TOTALSUPPLY))
  });


});
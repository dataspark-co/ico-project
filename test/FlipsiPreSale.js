const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const FlipsiToken = artifacts.require('FlipsiToken');
const FlipsiPreSale = artifacts.require('FlipsiPreSale');
    
contract('FlipsiPreSale', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const asserts = Asserts(assert);
  const OWNER = accounts[0];
  const beneficiary = accounts[9];

    
    //~ var balance = new BigNumber('131242344353464564564574574567456');
    
  let crowdsale;
  let tokenReward;
  let token;

  //~ let TOTALSUPPLY;
    
  before('setup', () => {
    return FlipsiPreSale.deployed()
    .then(instance => crowdsale = instance)
    .then(() => tokenReward = crowdsale.tokenReward())
    .then(() => console.log('TOKEN REWARD'))
    .then(() => tokenReward)
    .then((result) => console.log('TOKEN REWARD',result))
    .then(() => tokenReward)
    .then((result) => token = FlipsiToken.at(result))
    //~ .then(decimals => TOTALSUPPLY = web3.toBigNumber(TOTALTOKENS).mul(web3.toBigNumber(10).pow(decimals)) )//* math.pow(10,token.decimals()
    //~ .then(decimals => )
    .then(reverter.snapshot);
  });

it('should have totalSupply after create', () => {
    return Promise.resolve()
    .then(() => crowdsale.tokenReward())
    .then(console.log)
    .then(() => token.name())
    .then(console.log)
    .then(() => crowdsale.beneficiary())
    .then(asserts.equal(1))
  });


});
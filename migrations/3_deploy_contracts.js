var FlipsiToken = artifacts.require('./FlipsiToken.sol');
var FlipsiPreSale = artifacts.require('./FlipsiPreSale.sol');

module.exports = (deployer, network, accounts) => {
  const start = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1; // one second in the future
  //const durationInMinutes = 14400 * 20; // 20 days
  const durationInMinutes = 2; // 20 days
  const rateFlpToEther = web3.toWei(1/400,'ether')//new web3.BigNumber(1000);
  const beneficiary = accounts[1];
  const presaleHardcap = web3.toBigNumber(20000000*3/100).mul(web3.toBigNumber(10).pow(8));

  var token;

  deployer.then(() => {
    return FlipsiToken.new();
  })
  .then(instance => token = instance)
  .then(() => {
		return deployer.deploy(FlipsiPreSale,beneficiary, start, durationInMinutes, rateFlpToEther, presaleHardcap, token.address);
    })
  .then(() => {
    token.setSaleAgent(FlipsiPreSale.address, presaleHardcap);
  })
    ;
// FlipsiToken.setSaleAgent(FlipsiPreSale.address, 2000);
 /* deployer.deploy(FlipsiToken)
  .then(function() {
    return deployer.deploy(FlipsiPreSale,beneficiary, start, durationInMinutes, rateFlpToEther, presaleHardcap, FlipsiToken.address);
    })
    ;
    
*/};

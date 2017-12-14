var FlipsiToken = artifacts.require('./FlipsiToken.sol');
var FlipsiPreSale = artifacts.require('./FlipsiPreSale.sol');

module.exports = (deployer, network, accounts) => {
  const start = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1; // one second in the future
  const durationInMinutes = start + (14400 * 20); // 20 days
  const rateFlpToEther = new web3.BigNumber(1000);
  const beneficiary = accounts[1];
  const presaleHardcap = web3.toBigNumber(1000000).mul(web3.toBigNumber(10).pow(8));
  const token = accounts[2];
  console.log("HHHHHHHHHHHHHHHHHHHHHHHH");
  console.log(beneficiary);
  console.log(presaleHardcap);
  console.log(FlipsiToken.address);
  deployer.deploy(FlipsiToken)
	.then(function() {
    console.log("FlipsiToken.address", FlipsiToken.address);
		return deployer.deploy(FlipsiPreSale, FlipsiToken.address, start, durationInMinutes, rateFlpToEther, presaleHardcap, accounts[1]);
    })
    ;
};

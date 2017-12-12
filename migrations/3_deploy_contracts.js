var Ownable = artifacts.require('./Ownable.sol');
var Pausable = artifacts.require('./lifecycle/Pausable.sol');
var FlipsiCrowdsale = artifacts.require('./FlipsiCrowdsale.sol');
var FlipsiPreSale = artifacts.require('./FlipsiPreSale.sol');

module.exports = deployer => {
  deployer.deploy(FlipsiPreSale);
};

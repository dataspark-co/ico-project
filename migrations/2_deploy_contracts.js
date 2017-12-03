var FlipsiToken = artifacts.require('./FlipsiTokenCoin.sol');

module.exports = deployer => {
  deployer.deploy(FlipsiToken);
};

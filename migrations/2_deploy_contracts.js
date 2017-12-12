var FlipsiToken = artifacts.require('./FlipsiToken.sol');

module.exports = deployer => {
  deployer.deploy(FlipsiToken);
};

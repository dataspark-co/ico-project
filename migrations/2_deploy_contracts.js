const SimpleICO = artifacts.require('./SimpleTokenCoin.sol');
module.exports = deployer => {
  deployer.deploy(SimpleICO);
};

var FlipsiToken = artifacts.require('./FlipsiToken.sol');

module.exports = (deployer, network, accounts) => {
  const foundersAcc = accounts[7];
  const teamAcc = accounts[6];
  const devteamAcc = accounts[5];
  deployer.deploy(FlipsiToken, foundersAcc, teamAcc, devteamAcc);
};

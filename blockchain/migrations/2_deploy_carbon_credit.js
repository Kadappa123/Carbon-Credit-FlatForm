const CarbonCredit = artifacts.require("CarbonCredit");

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying CarbonCredit contract...");
  console.log("Network:", network);
  console.log("Deployer account:", accounts[0]);

  await deployer.deploy(CarbonCredit, { from: accounts[0] });
  const instance = await CarbonCredit.deployed();

  console.log("✅ CarbonCredit deployed at:", instance.address);
  console.log("");
  console.log("📋 Add these to your backend/.env:");
  console.log(`CONTRACT_ADDRESS=${instance.address}`);
  console.log(`DEPLOYER_ADDRESS=${accounts[0]}`);
};

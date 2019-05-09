var Catalog = artifacts.require("./Catalog.sol");
var ContentManager = artifacts.require("./BaseContentManagement");

var BookContent = artifacts.require("./BookContentManagement");
var MovieContent = artifacts.require("./MovieContentManagement");
var MusicContent = artifacts.require("./MusicContentManagement");

var web3;

var Web3= require ("web3");

if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
}

module.exports = function (deployer) {

    deployer.then(async () => {

        const catalogAddress = web3.eth.accounts[0];

        console.log("Catalog address: "+catalogAddress);

        const author1 = web3.eth.accounts[1];
        const author2 = web3.eth.accounts[2];
        const author3 = web3.eth.accounts[3];

        console.log("\n----Deploying Catalog----\n");
        const catalog = await deployer.deploy(Catalog);
        console.log("\n----Catalog deployed ----\n");


    });
};

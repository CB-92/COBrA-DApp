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
    deployer.deploy(Catalog);
};

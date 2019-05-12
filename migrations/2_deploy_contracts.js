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

        e = await web3.eth.getAccounts();
        console.log("Accounts:\n" + e);

        const catalogOwner = e[0];

        console.log("Catalog address: "+catalogOwner);

        const author1 = e[1];
        const author2 = e[2];
        const author3 = e[3];

        console.log("\n----Deploying Catalog----\n");
        const catalog = await deployer.deploy(Catalog, {from: catalogOwner});
        const catalogAddress = await catalog.address;

        console.log("\nCatalog address is: "+catalogAddress);   

        const title1 = web3.utils.asciiToHex("Per chi suona la campana");
        const artist1 = web3.utils.asciiToHex("Ernest Hemingway");
        const encoding1 = web3.utils.asciiToHex("epub");
        const price1 = parseInt("20");
        const pages1 = parseInt("547");

        const title2 = web3.utils.asciiToHex("Just Breathe");
        const artist2 = web3.utils.asciiToHex("Pearl Jam");
        const encoding2 = web3.utils.asciiToHex("mp3");
        const price2 = 300;
        const bitrate2 = 320;
        const duration2 = 5;

        console.log("\n--- Deploying content contract  ---\n")
        const content1 = await deployer.deploy(BookContent, title1, artist1, encoding1, pages1, catalogAddress, price1, {from:author1});

        const content2 = await deployer.deploy(MusicContent, title2, artist2, encoding2, bitrate2, duration2, catalogAddress, price2, {from:author2});

        
    });
};

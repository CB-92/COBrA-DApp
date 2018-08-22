var Catalog = artifacts.require("./Catalog.sol")

contract("Catalog", function(accounts) {
    it("initialization", function(){
        return Catalog.deployed().then(function(instance){
            return instance.paymentDelay();
        }).then(function (delay) {
            assert.equal(delay, 5);
        });
    });   
});
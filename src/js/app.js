App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    console.log("Web3 initialized");
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Catalog.json", function (catalog) {
      console.log("Catalog.json loaded");
      // Instantiate a new truffle contract from the artifact
      App.contracts.Catalog = TruffleContract(catalog);
      // Connect provider to interact with contract
      App.contracts.Catalog.setProvider(App.web3Provider);
      console.log("Contract initialized");

      return App.render();
    });
  },

  render: function () {
    var catalogInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        //$("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Catalog.deployed().then(function (instance) {
      console.log(("Contract deployed"));
      catalogInstance = instance;
      return catalogInstance.creator();
    }).then(function () {
      loader.hide();
      content.show();
    }).catch(function (error) {
      console.warn(error);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

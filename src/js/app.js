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

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Catalog.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.NewLinkedContent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("New content added to the catalog!", event)
        // Reload when a new content is linked
        App.render();
      });
    });
  },

  customizeModal: function(genre) {
    var pages = $("#p");
    var bitrate = $("#b");
    var duration = $("#d");
    var width = $("#w");
    var height = $("#h");
    switch (genre) {
      case "Book":
        pages.show();
        bitrate.hide();
        duration.hide();
        width.hide();
        height.hide();
        break;
      case "Movie":
        pages.hide();
        bitrate.show();
        duration.show();
        width.show();
        height.show();
        break;
      case "Music":
        pages.hide();
        bitrate.show();
        duration.show();
        width.hide();
        height.hide();
        break;
      default:
        pages.hide();
        bitrate.hide();
        duration.hide();
        width.hide();
        height.hide();
    }
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
      return catalogInstance.linkedContents();
    }).then(function (linkedContents) {
      var contents = $("#contentList");
      console.log(linkedContents);
      var contentList = catalogInstance.GetContentList();
      console.log(contentList);
      for (let i = 0; i < linkedContents; i++){
        var title = web3.toAscii(contentList[i]);
        var contentTemplate = "<li class=\"list-group-item\">" + title + "</li>";
        contents.append(contentTemplate);
      }
      loader.hide();
      App.customizeModal("");
      content.show();
    }).catch(function (error) {
      console.warn(error);
    });
  },

  selectedGenre: function () {
    var genre = $("#genre option:selected").text();
    App.customizeModal(genre);
  },

  addContent: function () {
    var title = $("#title").val();
    var author = $("#author").val();
    var genre = $("#genre option:selected").text();
    var encoding = $("#encoding").val();
    var price = parseInt($("#price").val());
    console.log("Title: "+title+"\nAuthor: "+author+"\nGenre: "+genre+"\nPrice: "+price);
    switch(genre){
      case "Book":
        var pages = $("#pages").val();
        break;
      case "Movie":
        var bitrate = $("#bitrate").val();
        var duration = $("#duration").val();
        var width = $("#width").val();
        var height = $("#height").val();
        break;
      case "Music":
        var bitrate = $("#bitrate").val();
        var duration = $("#duration").val();
        break;
      default:
        console.log("Invalid choice!");
    }
    App.contracts.Catalog.deployed().then(function (instance) {
      return instance.LinkToTheCatalog(web3.fromAscii(title), price, { from: App.account });
    }).then(function (result) {
      // Wait for contents to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  }

};

$(function() {
  $(window).on('load',function() {
    App.init();
  });
});

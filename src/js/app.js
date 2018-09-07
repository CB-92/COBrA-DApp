App = {
  web3Provider: null,
  contracts: {},
  catalogAddress: null,

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
      console.log("Catalog contract initialized");
      $.getJSON("BookContentManagement.json", function (book) {
        console.log("Book json loaded");
        // Instantiate a new truffle contract from the artifact
        App.contracts.BookContentManagement = TruffleContract(book);
        // Connect provider to interact with contract
        App.contracts.BookContentManagement.setProvider(App.web3Provider);
        console.log("BookContentManagement contract initialized");
        $.getJSON("MovieContentManagement.json", function (movie) {
          console.log("Movie json loaded");
          // Instantiate a new truffle contract from the artifact
          App.contracts.MovieContentManagement = TruffleContract(movie);
          // Connect provider to interact with contract
          App.contracts.MovieContentManagement.setProvider(App.web3Provider);
          console.log("MovieContentManagement contract initialized");
          $.getJSON("MusicContentManagement.json", function (music) {
            console.log("Music json loaded");
            // Instantiate a new truffle contract from the artifact
            App.contracts.MusicContentManagement = TruffleContract(music);
            // Connect provider to interact with contract
            App.contracts.MusicContentManagement.setProvider(App.web3Provider);
            console.log("MusicContentManagement contract initialized");

            App.listenForEvents();

            return App.render();
          });
        });
      });
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
        if(!error){
          console.log("New content added to the catalog!", event)
          // Reload when a new content is linked
          App.render();
        } else{
          console.log(error);
        }
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
    var tableBody = $("#tableBody");
    var modal = $("#addContentModal");
    var linkedContents = null;

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
      console.log(("Contract deployed with address: "+App.contracts.Catalog.address));
      catalogInstance = instance;
      return catalogInstance.linkedContents();
    }).then(function (lc) {
      linkedContents = lc;
      return catalogInstance.GetContentList();
    }).then(function (contentList) {
      console.log("Content list lenght: "+linkedContents);
      for (let i = 0; i < linkedContents; i++){
        var title = web3.toUtf8(contentList[i]);
        console.log("Content title: "+title);
        var contentTemplate = "<tr><td>"+title+"</td><td>autore</td><td>genere</td><td>prezzo</td></tr >";
        tableBody.append(contentTemplate);
      }
      loader.hide();
      App.customizeModal("");
      modal.hide();
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
    switch(genre){
      case "Book":
        var pages = parseInt($("#pages").val());
        App.contracts.BookContentManagement.new(web3.fromUtf8(title), web3.fromUtf8(author), web3.fromUtf8(encoding), pages, App.contracts.Catalog.address, price, { from: App.account }
      ).then(function (result) {
          console.log(result);
          // Wait for contents to update
          $("#content").hide();
          $("#loader").show();
        }).catch(function (err) {
          console.error(err);
        });
        break;
      case "Movie":
        var bitrate = parseInt($("#bitrate").val());
        var duration = parseInt($("#duration").val());
        var width = parseInt($("#width").val());
        var height = parseInt($("#height").val());
        App.contracts.MovieContentManagement.new(web3.fromUtf8(title), web3.fromUtf8(author), web3.fromUtf8(encoding), bitrate, duration, width, height, App.contracts.Catalog.address, price, { from: App.account }
        ).then(function () {
          // Wait for contents to update
          $("#content").hide();
          $("#loader").show();
        }).catch(function (err) {
          console.error(err);
        });
        break;
      case "Music":
        var bitrate = parseInt($("#bitrate").val());
        var duration = parseInt($("#duration").val());
        App.contracts.MusicContentManagement.new(web3.fromUtf8(title), web3.fromUtf8(author), web3.fromUtf8(encoding), bitrate, duration, App.contracts.Catalog.address, price, { from: App.account }
        ).then(function () {
          // Wait for contents to update
          $("#content").hide();
          $("#loader").show();
        }).catch(function (err) {
          console.error(err);
        });
        break;
      default:
        console.log("Invalid choice!");
    }
  }

};

$(function() {
  $(window).on('load',function() {
    App.init();
  });
});

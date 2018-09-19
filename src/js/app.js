App = {
  web3Provider: null,
  contracts: {},
  catalogAddress: null,
  premiumGift: false,
  contentTitle: null,

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

            premiumGift = false;
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

  openContentModal: function (t) {
    contentTitle = t;
    $("#giftContentModal").modal('show');
    $(document.body).addClass('modal-open');
    $('.modal-backdrop').add();
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
    var contents = $("#contents");
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
      catalogInstance = instance;
      var user = App.account;
      console.log("User: "+user);
      return catalogInstance.IsPremium(user);
    }).then(function (result) {
      console.log(App.account + " is premium user? "+ result);
      
      if(result){
        $("#premiumLabel").show();
      } else {
        $("#premiumLabel").hide();
      }
      return catalogInstance.NumberOfLinkedContents();    
    }).then(function (lc) {
      linkedContents = lc;
      if(lc>0) return catalogInstance.GetStatistics();
      else return false;
    }).then(function (result) {
      console.log("Number of linked contents: " + linkedContents);
      contents.empty();
      if(linkedContents>0){
        var contentList = result[0];
        var views = result[1];
        for (let i = 0; i < linkedContents; i++) {
          var title = web3.toUtf8(contentList[i]);
          var contentViews = views[i];
          var contentTemplate = "<li class=\"list-group-item d-flex justify-content-between align-items-center\">"
            + title + "<div class = \"ml-auto\"><a href =\"#\" onclick=\"App.buyContent('"+title+"'); return false;\"><span class=\"fa fa-shopping-cart list-icon\"></span></a>"
            + "<a href=\"#\"><span class=\"fa fa-gift list-icon\" onclick=\"App.openContentModal('"+title+"');return false;\"  ></span></a>"
            + "<a href=\"#\"><span class=\"fa fa-play list-icon\" onclick=\"App.consumeContent('" + title +"'); return false;\"></span></a>"+"<span class=\"badge badge-primary badge-pill fa fa-eye list-icon\">\t" + contentViews + "</span></div></li>";
          contents.append(contentTemplate);
        }
      }
      App.customizeModal("");
      modal.modal('hide');
      $(document.body).removeClass('modal-open');
      $('.modal-backdrop').remove();
      loader.hide();
      content.show();
    }).catch(function (error) {
      console.warn(error);
    });
  },

  selectedGenre: function () {
    var genre = $("#genre option:selected").text();
    App.customizeModal(genre);
  },

  selectedFilter: function (id) {
    var filter = $("#filter"+ id +" option:selected").text();

    switch (filter) {
      case "Author":        
        $("#"+id+"byauthorinput").show();
        $("#" + id + "bygenreinput").hide();
        break;
      case "Genre":
        $("#" + id + "byauthorinput").hide();
        $("#" + id + "bygenreinput").show();
        break;
      default:
        $("#" + id + "byauthorinput").hide();
        $("#" + id + "bygenreinput").hide();        
        break;
    }
  },

  giftPremiumChecked: function (checkbox) {
    var p = $("#premiumGiftPar");
    var input = $("#premiumGiftInput");
    if (checkbox.checked == true) {
      p.show();
      input.show();
      premiumGift = true;      
    } else{
      p.hide();
      input.hide();
      premiumGift = false;
    }
  },

  buyPremium: function () {
    console.log("Checkbox value: "+premiumGift);
    
    var address = $("#address").val();
    
    App.contracts.Catalog.deployed().then(async (instance) => {
      const premiumCost = await instance.premiumPrice();
      if (premiumGift) {
        if(!web3.isAddress(address)){
          alert("Wrong address format!");
          $("#premiumGiftPar").hide();
          $("#premiumGiftInput").hide();
          App.render();
          return;
        }
        alert("REMINDER: You are buying a premium subscription for "+address+" at the cost of " +
          web3.fromWei(premiumCost, "ether") + " ether. Confirm or reject the transation on metamask.");

        transaction = await instance.GiftPremium(address, { from: App.account, value: premiumCost });
      } else {
        alert("REMINDER: You are buying a premium subscription at the cost of " +
          web3.fromWei(premiumCost, "ether") + " ether. Confirm or reject the transation on metamask.");

        transaction = await instance.BuyPremium({ from: App.account, value: premiumCost });
      }
    }).then(function () {
      $("#premiumGiftPar").hide();
      $("#premiumGiftInput").hide();
      //$("#premiumButton").hide();       
    }).catch(function (error) {
      console.log(error);
    });
  },

  consumeContent: function (title) {
    App.contracts.Catalog.deployed().then(async (instance) => {
      const address = await instance.GetContentAddress(web3.fromUtf8(title));
      console.log("Content "+title+" has address "+address);
      
      //TODO chiamata a consumeContent del contenuto
    }).catch(function (error) {
      console.log(error);
    });
  },

  buyContent: function(title) {
    App.contracts.Catalog.deployed().then(async (instance) => {
      const isPremium = await instance.IsPremium(App.account);
      if(isPremium){
        transaction = await instance.GetContentPremium(web3.fromUtf8(title), { from: App.account});
      } else {
        const contentCost = await instance.getContentPrice(title);
        console.log("Prezzo: " + contentCost);

        alert("REMINDER: You are buying " + title + " at the cost of " +
          web3.fromWei(contentCost, "ether") + " ether. Confirm or reject the transation on metamask.");

        transaction = await instance.GetContent(web3.fromUtf8(title), { from: App.account, value: contentCost });
      }
      console.log("Content bought!");
    }).catch(function (error) {
      console.log(error);
      alert("An error occured while processing the transaction!");
    });
  },

  giftContent: function () {
    var address = $("#giftAddress").val();
    App.contracts.Catalog.deployed().then(async (instance) => {
      const contentCost = await instance.getContentPrice(contentTitle);
      console.log("Prezzo: " + contentCost);
      alert("REMINDER: You are buying " + contentTitle + " for "+address+" at the cost of " +
      web3.fromWei(contentCost, "ether") + " ether. Confirm or reject the transation on metamask.");
      transaction = await instance.GiftContent(web3.fromUtf8(contentTitle), address, { from: App.account, value: contentCost });
      console.log("Content bought!");
    }).catch(function (error) {
      console.log(error);
      alert("An error occured while processing the transaction!");
    });
  },

  getLatest: function () {
    var temp = null;
    var result = null;
    var filter = $("#filterlatest option:selected").text();
    console.log(filter);
    
    App.contracts.Catalog.deployed().then(async (instance) =>{
      switch (filter) {
        case "Author":
          temp = $("#latestbyauthorinput").val();
          console.log(temp);
          
          result = await instance.GetLatestByAuthor(web3.toUtf8(temp), {from: App.account});
          console.log(web3.fromUtf8(result));
          
          break;

        case "Genre":
          temp = $("#latestbygenreinput").val();
          console.log(temp);

          result = await instance.GetLatestByGenre(web3.toUtf8(temp), { from: App.account });
          console.log(web3.fromUtf8(result));
          break;
        default:
          break;
      }
    }).catch(function (error) {
      console.log(error);
      alert("An error occured while processing the transaction!");
    });
  },

  getPopular: function () {
    var temp = null;
    var result = null;
    var filter = $("#filterpopular option:selected").text();
    console.log(filter);

    App.contracts.Catalog.deployed().then(async (instance) => {
      switch (filter) {
        case "Author":
          temp = $("#popularbyauthorinput").val();
          console.log(temp);

          result = await instance.GetLatestByAuthor(web3.toUtf8(temp), { from: App.account });
          console.log(web3.fromUtf8(result));

          break;

        case "Genre":
          temp = $("#popularbygenreinput").val();
          console.log(temp);

          result = await instance.GetLatestByGenre(web3.toUtf8(temp), { from: App.account });
          console.log(web3.fromUtf8(result));
          break;
        default:
          break;
      }
    }).catch(function (error) {
      console.log(error);
      alert("An error occured while processing the transaction!");
    });
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
      ).then(function () {
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

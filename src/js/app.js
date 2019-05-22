App = {
  web3Provider: null,
  contracts: {},
  catalogAddress: null,
  premiumGift: false,
  contentTitle: null,
  categoryEnum: null,
  genreEnum: null,
  listeningBlocks: 30,
  preferences: [],


  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = window.ethereum; 
      web3 = new Web3(App.web3Provider);

      //
      try {
        ethereum.enable().then(async() => {
            console.log("New Metamask privacy feature ok!");
        });
      } catch(error) {
        console.log("Error in testing new Metamask privacy feature!");
        alert(error.message);
      }

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
      $.getJSON("BaseContentManagement.json", function (base) {
        App.contracts.BaseManager = TruffleContract(base);
        App.contracts.BaseManager.setProvider(App.web3Provider);
        console.log("Base Content manager loaded");
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
              categoryEnum = {"none":0, "appreciation":1, "quality":2, "price":3};
              genreEnum = { "book":0, "movie":1, "music":2};

              preferences = [];
              App.listenForEvents();

              return App.render();
            });
          });
        });
      });
    });
  },

  appendNotification: function(title, text){
    var mainContainer = $('#main_container');

    var toast = "<div class=\"toast\" data-autohide=\"false\"><div class=\"toast-header\"><strong class=\"mr-auto text-primary\">"+title+"</strong><button type=\"button\" class=\"ml-2 mb-1 close\" onclick=\"$(this).closest('.toast').remove(); \">&times;</button></div><div class=\"toast-body\">"+text+"</div></div>";

    mainContainer.append(toast);

    $('.toast').toast('show');

  },
  

  // Listen for events emitted from the contract
  listenForEvents: function () {
    
    App.contracts.Catalog.deployed().then(async(instance) =>{

      // Load user intersts
      const interests = await instance.GetInterestsNum({from: App.account});

      console.log("Numero preferenze: " + interests);

      const p = await instance.GetInterests({from:App.account});
      App.preferences = p.map(x => web3.utils.hexToUtf8(x));

      console.log("Preferences' lenght: "+App.preferences.length);

      web3.eth.getBlockNumber(function (error, block) {

        var initialBlock = block - App.listeningBlocks;
        if(initialBlock < 0) initialBlock = 0;

        console.log("Blocco corrente: "+block);
        console.log("Initial block: "+initialBlock);

        // Access granted to a content

        instance.AccessGranted({fromBlock: block, toBlock: 'latest'}).on('data', (event)=>{
          console.log("Evento AccessGranted registrato:");
          console.log(event);
          console.log("User: "+event.returnValues._user);

          if(event.returnValues._user==App.account){
            App.appendNotification("Access Granted", 'Congratulations!\nNow you\'ve access to content '+web3.utils.hexToUtf8(event.returnValues._content)+".");
          }
        });


        instance.NewLinkedContent({fromBlock: initialBlock, toBlock: 'latest'}).on('data', (event)=>{
          console.log("Evento NewLinkedContent registrato:");
          console.log(event);
          var temp = null;
          switch(event.returnValues._genre){
            case "0":
              temp = "book";
              break;
            case "1":
              temp = "movie";
              break;
            case "2":
              temp = "music";
              break;
            default:
              break;
          }

          console.log(temp);
          const author = web3.utils.hexToUtf8(event.returnValues._author);
          console.log("Author: "+author);

          if(App.preferences.indexOf(author)!=-1){
            App.appendNotification("New Linked Content", "There is a new content from "+author+"!");  
          }

          if(App.preferences.indexOf(temp)!=-1){
            App.appendNotification("New Linked Content", "There is a new content matching your interests!");
          }
          
        });

        instance.ContentConsumed({fromBlock: block, toBlock: 'latest'}).on('data', (event)=>{
          console.log("Evento ContentConsumed registrato.");
          console.log(event);
          if(App.account == event.returnValues._user){
            App.openFeedbackModal(event.returnValues._content);
          }
        });
        
        instance.AuthorPaid({fromBlock: block, toBlock: 'latest'}).on('data', (event)=>{
          console.log("Evento AuthorPayed registrato:");
          console.log(event);

          console.log("Owner: "+event.returnValues._owner);
          console.log("App account: "+App.account)

          App.appendNotification("Author Paid", 'User '+ event.returnValues._owner +' has been rewarded for content '+web3.utils.hexToUtf8(event.returnValues._content)+"!");
          
        });
        
        instance.ClosedCatalog({fromBlock: initialBlock, toBlock: 'latest'}).on('data', (event)=>{
          console.log("Evento ClosedCatalog registrato:\n");
          alert('This catalog has been closed by the owner!');
        });

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
      if (err == null) {
        App.account = web3.utils.toChecksumAddress(account);
        console.log("App.account: "+App.account);
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
        console.log("Views: "+views);
        for (let i = 0; i < linkedContents; i++) {
          var title = web3.utils.hexToUtf8(contentList[i]);
          var contentViews = views[i];
          var contentTemplate = "<li class=\"list-group-item d-flex justify-content-between align-items-center\">"
            + title + "<div class = \"ml-auto\"><a href =\"#\" onclick=\"App.buyContent('"+title+"'); return false;\"><span class=\"fa fa-shopping-cart list-icon\"></span></a>"
            + "<a href=\"#\"><span class=\"fa fa-gift list-icon\" onclick=\"App.openContentModal('"+title+"');return false;\"  ></span></a>"
            + "<a href=\"#\"><span class=\"fa fa-play list-icon\" onclick=\"App.consumeContent('" + title +"'); return false;\"></span></a>"+"<a href=\"#\"><span class=\"fa fa-trash list-icon\" onclick=\"App.deleteContent('"+title+"');return false;\"  ></span></a>"
            +"<span class=\"badge badge-primary badge-pill fa fa-eye list-icon\">\t" + contentViews + "</span></div></li>";
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
      alert(error.message);
    });
  },

  deleteContent: function(title){
    App.contracts.Catalog.deployed().then(async (instance) => {
      await instance.DeleteContent(web3.utils.utf8ToHex(title), {from:App.account});
      App.render();
    }).catch(function(error){
      console.log(error);
      alert(error.message);
    });
  },

  closeCatalog: function(){
    App.contracts.Catalog.deployed().then(async (instance) => {
      await instance.CloseCatalog({from:App.account});

    }).catch(function(error){
      console.log(error);
      alert(error.message);
    });
  },

  addInterest: function(){
    var filter = $("#filterinterest option:selected").text();

    App.contracts.Catalog.deployed().then(async (instance) => {
      
      switch (filter) {
        case "Author":
          var temp = $("#interestbyauthorinput").val();
          
          await instance.AddInterest(web3.utils.utf8ToHex(temp), {from:App.account});
          
          break;
  
        case "Genre":
          var temp = $("#interestbygenreinput option:selected").val();
  
          await instance.AddInterest(web3.utils.utf8ToHex(temp), {from:App.account});
  
          break;
        default:
          break;
      }

      console.log("You registered the interest: "+temp);
      App.render();
      
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
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
        if(!web3.utils.isAddress(address)){
          alert("Wrong address format!");
          $("#premiumGiftPar").hide();
          $("#premiumGiftInput").hide();
          App.render();
          return;
        }
        alert("REMINDER: You are buying a premium subscription for "+address+" at the cost of " +
          web3.utils.fromWei(premiumCost, "ether") + " ether. Confirm or reject the transation on metamask.");

        transaction = await instance.GiftPremium(address, { from: App.account, value: premiumCost });
      } else {
        alert("REMINDER: You are buying a premium subscription at the cost of " +
          web3.utils.fromWei(premiumCost, "ether") + " ether. Confirm or reject the transation on metamask.");

        transaction = await instance.BuyPremium({ from: App.account, value: premiumCost });
      }
    }).then(function () {
      $("#premiumGiftPar").hide();
      $("#premiumGiftInput").hide();
      App.render(); 
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    });
  },

  consumeContent: function (title) {
    App.contracts.Catalog.deployed().then(async (instance) => {
      const address = await instance.GetContentAddress(web3.utils.utf8ToHex(title));
      console.log("Content "+title+" has address "+address);
      const manager = await App.contracts.BaseManager.at(address);
      var content = await manager.consumeContent({from: App.account});
      console.log(title +" consumed by "+App.account);

    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    });
  },

  openFeedbackModal: function (t) {
    contentTitle = t;
    $(document.body).addClass('modal-open');
    $('.modal-backdrop').add();
    $("#feedbackModal").modal('show');
  },

  leaveFeedback: function () {
    console.log("Feedback for content "+contentTitle);
    var a = $('input[name=appreciation]:checked', '#appreciationForm').val();
    console.log("Appreciation of the content: "+a);
    var q = $('input[name=quality]:checked', '#qualityForm').val();
    console.log("Content quality: "+q);
    var p = $('input[name=price]:checked', '#priceForm').val();
    console.log("Price fairness: "+p);
    App.contracts.Catalog.deployed().then(async (instance) => {
      await instance.LeaveFeedback(contentTitle, p, a, q, {from: App.account});
      App.render();
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    });
  },

  buyContent: function(title) {
    const t = web3.utils.asciiToHex(title);
    console.log("asciiToHex: "+t);
    App.contracts.Catalog.deployed().then(async (instance) => {
      const isPremium = await instance.IsPremium(App.account);
      if(isPremium){
        transaction = await instance.GetContentPremium(t, { from: App.account});
      } else {
        const contentCost = await instance.getContentPrice(t);
        console.log("Prezzo: " + contentCost);

        alert("REMINDER: You are buying " + title + " at the cost of " +
          web3.utils.fromWei(contentCost, "ether") + " ether. Confirm or reject the transation on metamask.");

        transaction = await instance.GetContent(t, { from: App.account, value: contentCost });
      }
      console.log("Content bought!");
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    });
  },

  giftContent: function () {
    var address = $("#giftAddress").val();
    App.contracts.Catalog.deployed().then(async (instance) => {
      const contentCost = await instance.getContentPrice(web3.utils.utf8ToHex(contentTitle));
      console.log("Prezzo: " + contentCost);
      alert("REMINDER: You are buying " + contentTitle + " for "+address+" at the cost of " +
      web3.utils.fromWei(contentCost, "ether") + " ether. Confirm or reject the transation on metamask.");
      transaction = await instance.GiftContent(web3.utils.utf8ToHex(contentTitle), address, { from: App.account, value: contentCost });
      console.log("Content bought!");
    }).catch(function (error) {
      console.log(error);
      alert("An error occured while processing the transaction!");
    });
  },

  getLatest: function () {
    var temp = null;
    var result = null;
    var list = $("#latestContentsList");
    list.empty();
    var filter = $("#filterlatest option:selected").text();
    console.log(filter);
    
    App.contracts.Catalog.deployed().then(async (instance) =>{
      switch (filter) {
        case "Author":
          temp = $("#latestbyauthorinput").val();
          
          var r = await instance.GetLatestByAuthor(web3.utils.utf8ToHex(temp), {from: App.account});
          result = web3.utils.hexToUtf8(r);
          console.log(result);
          
          break;

        case "Genre":
          temp = $("#latestbygenreinput option:selected").val();
          console.log(genreEnum[temp]);
          var r = await instance.GetLatestByGenre(genreEnum[temp], { from: App.account });
          console.log(r);
          result = web3.utils.hexToUtf8(r);
          console.log(result);
              
          break;
        default:
          break;
      }
      var contentTemplate = "<li class=\"list-group-item d-flex justify-content-between align-items-center\">"
            + result + "<div class = \"ml-auto\"><a href =\"#\" onclick=\"App.buyContent('" + result + "'); return false;\"><span class=\"fa fa-shopping-cart list-icon\"></span></a>"
            + "<a href=\"#\"><span class=\"fa fa-gift list-icon\" onclick=\"App.openContentModal('" + result + "');return false;\"></span></a>"
            + "<a href=\"#\"><span class=\"fa fa-play list-icon\" onclick=\"App.consumeContent('" + result + "'); return false;\"></span></a></div></li>";
      list.append(contentTemplate);
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    });
  },

  getPopular: function () {
    var temp = null;
    var result = null;
    var list = $("#mostPopularList");
    list.empty();
    var filter = $("#filterpopular option:selected").text();
    console.log(filter);

    App.contracts.Catalog.deployed().then(async (instance) => {
      switch (filter) {
        case "Author":
          temp = $("#popularbyauthorinput").val();
          console.log(temp);

          result = await instance.GetLatestByAuthor(web3.utils.utf8ToHex(temp), { from: App.account });
          console.log(web3.utils.hexToUtf8(result));

          break;

        case "Genre":
          temp = $("#popularbygenreinput option:selected").val();
          result = await instance.GetMostPopularByGenre(genreEnum[temp], {from: App.account});
          console.log(web3.utils.hexToUtf8(result));

          break;
        default:
          break;
      }
      var r = web3.utils.hexToUtf8(result);
      var contentTemplate = "<li class=\"list-group-item d-flex justify-content-between align-items-center\">"
        + r + "<div class = \"ml-auto\"><a href =\"#\" onclick=\"App.buyContent('" + r + "'); return false;\"><span class=\"fa fa-shopping-cart list-icon\"></span></a>"
        + "<a href=\"#\"><span class=\"fa fa-gift list-icon\" onclick=\"App.openContentModal('" + r + "');return false;\"></span></a>"
        + "<a href=\"#\"><span class=\"fa fa-play list-icon\" onclick=\"App.consumeContent('" + r + "'); return false;\"></span></a></div></li>";
      list.append(contentTemplate);
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    });
  },

  getMostRated: function () {
    var temp = null;
    var result = null;
    var list = $("#ratedContentList");  
    list.empty();
    var filter = $("#filterrated option:selected").text();
    var category = $("#category option:selected").val();
    console.log("Category: "+categoryEnum[category]+ " by "+ filter);    

    App.contracts.Catalog.deployed().then(async (instance) => {
      switch (filter) {
        case "Author":
          console.log("GetMostRatedByAuthor");
          temp = $("#ratedbyauthorinput").val();
          result = await instance.GetMostRatedByAuthor(web3.utils.utf8ToHex(temp), categoryEnum[category],{ from: App.account });

          break;

        case "Genre":
          console.log("GetMostRatedByGenre");
          temp = $("#ratedbygenreinput option:selected").val();
          console.log("Valore genere: "+temp);
          console.log("Genere: "+genreEnum[temp]+", categoria: "+categoryEnum[category]);
          result = await instance.GetMostRatedByGenre(genreEnum[temp], categoryEnum[category], { from: App.account });

          break;
        default:
          console.log("GetMostRated");
          result = await instance.GetMostRated(categoryEnum[category], {from: App.account});
          break;
      }

      var r = web3.utils.hexToUtf8(result);
      var contentTemplate = "<li class=\"list-group-item d-flex justify-content-between align-items-center\">"
        + r + "<div class = \"ml-auto\"><a href =\"#\" onclick=\"App.buyContent('" + r + "'); return false;\"><span class=\"fa fa-shopping-cart list-icon\"></span></a>"
        + "<a href=\"#\"><span class=\"fa fa-gift list-icon\" onclick=\"App.openContentModal('" + r + "');return false;\"></span></a>"
        + "<a href=\"#\"><span class=\"fa fa-play list-icon\" onclick=\"App.consumeContent('" + r + "'); return false;\"></span></a></div></li>";
      list.append(contentTemplate);
    }).catch(function (error) {
      console.log(error);
      alert(error.message);
    })
  },

  addContent: function () {
    var title = $("#title").val();
    var author = $("#author").val();
    var genre = $("#genre option:selected").text();
    var encoding = $("#encoding").val();
    var price = parseInt($("#price").val());

    console.log("Content metadata:\nTitle: "+title+", author: "+author+", genre: "+genre+", encoding: "+encoding+", price: "+price);

    switch(genre){
      case "Book":
        var pages = parseInt($("#pages").val());
        App.contracts.BookContentManagement.new(web3.utils.utf8ToHex(title), web3.utils.utf8ToHex(author), web3.utils.utf8ToHex(encoding), pages, App.contracts.Catalog.address, price, { from: App.account }
      ).then(function () {
          App.render();
        }).catch(function (err) {
          console.error(err);
          alert(err.message);
        });
        break;
      case "Movie":
        var bitrate = parseInt($("#bitrate").val());
        var duration = parseInt($("#duration").val());
        var width = parseInt($("#width").val());
        var height = parseInt($("#height").val());
        App.contracts.MovieContentManagement.new(web3.utils.utf8ToHex(title), web3.utils.utf8ToHex(author), web3.utils.utf8ToHex(encoding), bitrate, duration, width, height, App.contracts.Catalog.address, price, { from: App.account }
        ).then(function () {
          App.render();
        }).catch(function (err) {
          console.error(err);
          alert(err.message);
        });
        break;
      case "Music":
        var bitrate = parseInt($("#bitrate").val());
        var duration = parseInt($("#duration").val());
        App.contracts.MusicContentManagement.new(web3.utils.utf8ToHex(title), web3.utils.utf8ToHex(author), web3.utils.utf8ToHex(encoding), bitrate, duration, App.contracts.Catalog.address, price, { from: App.account }
        ).then(function () {
          App.render();
        }).catch(function (err) {
          console.error(err);
          alert(err.message);
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

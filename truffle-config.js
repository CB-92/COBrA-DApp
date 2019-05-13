var HDWalletProvider = require("truffle-hdwallet-provider");
var endpoint = "ropsten.infura.io/v3/892bb67f2e244482abd62837ac167442";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!

  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },

    ropsten: {
      network_id: 3
    }
  }
};

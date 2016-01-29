"use strict";

$(document).ready(function() {
  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
  web3.eth.defaultAccount = web3.eth.accounts[0];

  $("#create").submit(function(event) {

    // Stop form from submitting normally
    event.preventDefault();

    var data = {
      user_id: "29908850",
      activity: "running",
      measurement: "total_distance",
      comparison: "ge",
      goal: "4000",
      settlement_date: "2014-09-23",
      objection_period_secs: "604800",
      accept_terms_of_service: "current",
      use_existing: "1"
    };

    $.post("https://www.realitykeys.com/api/v1/runkeeper/new", data);
  });
});

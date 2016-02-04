"use strict";

$(document).ready(function() {
  var web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
  web3.eth.defaultAccount = web3.eth.accounts[0];

  var runkeeperContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"hash","type":"bytes32"},{"name":"resultHex","type":"bytes32"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"settle","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"getCommitment","outputs":[{"name":"factId","type":"uint256"},{"name":"factHash","type":"bytes32"},{"name":"amount","type":"uint256"},{"name":"owner","type":"address"},{"name":"defaultAccount","type":"address"},{"name":"oracle","type":"address"},{"name":"threshold","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"getMyCommitmentCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"factId","type":"uint256"},{"name":"factHash","type":"bytes32"},{"name":"defaultAccount","type":"address"},{"name":"oracle","type":"address"},{"name":"threshold","type":"uint256"}],"name":"makeCommitment","outputs":[{"name":"hash","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"i","type":"uint256"}],"name":"getMyCommitmentHash","outputs":[{"name":"","type":"bytes32"}],"type":"function"}]);

  var runkeeper = runkeeperContract.at("0x5fdef2af54a909fa431f78cca795052e9fb1aba7");

  var numCommitments = runkeeper.getMyCommitmentCount();
  $('#commitments').append('Number of commitments: ' + numCommitments + '<br />');

  for (var i = 0; i < numCommitments; i++) {
    var hash = runkeeper.getMyCommitmentHash(i);
    $('#commitments').append('<code class="hash">' + hash + '</code><br />');
  }
  
  $('.hash').on('click', function(event) {
    showCommitment($(this).text());
  });


  $("#create").submit(function(event) {

    // Stop form from submitting normally
    event.preventDefault();

    var meters = $("#meters").val();
    var defaultAccount = $("#default_account").val();

    var data = {
      user_id: $("#user_id").val(),
      activity: "running",
      measurement: "total_distance",
      comparison: "ge",
      goal: meters,
      settlement_date: $("#end_date").val(),
      objection_period_secs: "604800",
      accept_terms_of_service: "current",
      use_existing: "1"
    };

    $.post("https://www.realitykeys.com/api/v1/runkeeper/new", data, function(data) {
      console.log(data);
      var tx = runkeeper.makeCommitment(data.id, "0x" + data.signature_v2.fact_hash, defaultAccount, "0x" + data.signature_v2.ethereum_address, meters, {gas: 250000});
      console.log(tx);
    });
  });

  function showCommitment(hash) {
    $('body').empty();
    var details = runkeeper.getCommitment(hash);
    var factId = details[0].toFixed();
    var amount = details[2].toFixed();
    
    $.get("https://www.realitykeys.com/api/v1/runkeeper/" + factId + "?accept_terms_of_service=current", function(data) {
      console.log(data);
      $('body').append("Activity: " + data.activity + "<br />");
      $('body').append("Goal: " + data.goal + "<br />");
      $('body').append("Settlement date: " + data.settlement_date + "<br />");
      
      if (data.signature_v2.signed_value) {
        var tx = runkeeper.makeCommitment(hash, data.signature_v2.signed_value, data.signature_v2.sig_v, data.signature_v2.sig_r, data.signature_v2.sig_s, {gas: 250000});
        console.log(tx);
      }
    });
  }
});

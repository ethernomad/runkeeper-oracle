"use strict";

var runkeeper, web3;

function newCommitment(user_id) {
  $('#user_id').val(user_id);
  $('#create').show();
}

function listCommitments() {
  $('#runkeeper').on('click', function(event) {
    event.preventDefault();
    location = "https://www.realitykeys.com/runkeeper/start-auth?return_url=" + encodeURIComponent(location.protocol + '//' + location.host + location.pathname);
  });

  $('#commitments').show();

  var numCommitments = runkeeper.getMyCommitmentCount({}, 'pending');
  if (numCommitments == 0) {
    $('td.loading').hide();
  }

  for (var i = 0; i < numCommitments; i++) {
    var hash = runkeeper.getMyCommitmentHash(i, {}, 'pending');
    var details = runkeeper.getCommitment(hash, {}, 'pending');
    var factId = details[0].toFixed();
    var amount = details[2].toFixed();

    $.get("https://www.realitykeys.com/api/v1/runkeeper/" + factId + "?accept_terms_of_service=current", function(data) {

      $('td.loading').hide();

      let status;
      if (data.signature_v2.signed_value === null) {
        status = 'pending';
      }
      else if (data.signature_v2.signed_value === 0) {
        status = 'failure';
      }
      else {
        status = 'success';
      }

      $('#commitments table tbody').append('<tr><td>' + data.goal + '</td><td>' + data.settlement_date + '</td><td>' + web3.fromWei(details[2], 'ether') + '</td><td>' + status + '</td><td>' + (details[6] ? "true" : "false") + '</td><td><a href="#" class="hash-' + hash + '">view</a></td></tr>');

      $('.hash-' + hash).on('click', function(event) {
        showCommitment(hash);
      });
    });
  }
}

function showCommitment(hash) {
  $('#main').fadeTo('slow', 0);

  var details = runkeeper.getCommitment(hash, {}, 'pending');
  var factId = details[0].toFixed();
  var amount = details[2].toFixed();
  
  $.get("https://www.realitykeys.com/api/v1/runkeeper/" + factId + "?accept_terms_of_service=current", function(data) {
    $('#main').empty();
    $('#main').fadeTo('fast', 1);
    $('#main').append('<h2>Commitment information</h2>');

    var table = '<table class="specific-commitment"><tbody>';
    table += '<tr><td>User ID</td><td>' + data.user_id + '</td></tr>';
    table += '<tr><td>Activity</td><td>' + data.activity + '</td></tr>';
    table += '<tr><td>Goal</td><td>' + data.goal + 'm</td></tr>';
    table += '<tr><td>Settlement date</td><td>' + data.settlement_date + '</td></tr>';
    table += '<tr><td>Amount</td><td>' +  web3.fromWei(details[2], 'ether') + ' ether</td></tr>';
    table += '<tr><td>Success payout address</td><td><code>' + details[3] + '</code></td></tr>';
    table += '<tr><td>Failure payout address</td><td><code>' + details[4] + '</code></td></tr>';
    table += '<tr><td>Settled</td><td>' +  (details[6] ? "true" : "false") + '</td></tr>';
    table += '</tbody></table>';
    $('#main').append(table);

    if (!result[6] && data.signature_v2.signed_value) {
      $('#main').append("Attempting to settle...<br />");
      var tx = runkeeper.settle(hash, '0x' + data.signature_v2.signed_value, data.signature_v2.sig_v, '0x' + data.signature_v2.sig_r, '0x' + data.signature_v2.sig_s, {gas: 250000}, function(err, tx) {
        showCommitment(hash);
      });
    }
  });
}

$(document).ready(function() {

  var queries = {};
  $.each(document.location.search.substr(1).split('&'), function(c,q){
      var i = q.split('=');
      if (i.length > 1) {
        queries[i[0].toString()] = i[1].toString();
      }
  });

  web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
  web3.eth.defaultAccount = web3.eth.accounts[0];

  var runkeeperContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"hash","type":"bytes32"},{"name":"resultHex","type":"bytes32"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"settle","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"getCommitment","outputs":[{"name":"factId","type":"uint256"},{"name":"factHash","type":"bytes32"},{"name":"amount","type":"uint256"},{"name":"owner","type":"address"},{"name":"defaultAccount","type":"address"},{"name":"oracle","type":"address"},{"name":"settled","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"getMyCommitmentCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"factId","type":"uint256"},{"name":"factHash","type":"bytes32"},{"name":"defaultAccount","type":"address"},{"name":"oracle","type":"address"}],"name":"makeCommitment","outputs":[{"name":"hash","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"i","type":"uint256"}],"name":"getMyCommitmentHash","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"hash","type":"bytes32"},{"indexed":false,"name":"result","type":"bool"}],"name":"commitmentSettled","type":"event"}]);

  runkeeper = runkeeperContract.at("0x8d4a168bfabd4bfb4e2539828ad966a72b4ffc70");

  if (queries.completed_user_id > 0) {
    newCommitment(queries.completed_user_id);
  }
  else {
    listCommitments();
  }


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
      if (data.hasOwnProperty('errors')) {
        for (let key in data.errors) {
          alert(key + ': ' + data.errors[key]);
        }
      }
      else {
        var tx = runkeeper.makeCommitment(data.id, "0x" + data.signature_v2.fact_hash, defaultAccount, "0x" + data.signature_v2.ethereum_address, {value: web3.toWei($("#amount").val(), "ether"), gas: 250000}, function(err, tx) {
          if (err) {
            alert(err);
          }
          else {
            location.reload();
          }
        });
      }
    });
  });
});

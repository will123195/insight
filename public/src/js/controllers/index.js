'use strict';

var TRANSACTION_DISPLAYED = 10;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  function($scope, Global, getSocket, Blocks, $sce) {
    $scope.global = Global;

    var ioid = $cookies.io || '123';
    console.log('ioid:', ioid);
    var url = 'https://www.coinbase.com/checkouts/0f512df0ae702a4e52f1a91e5823b736/inline?c=' + ioid;
    $scope.iframeUrl = $sce.trustAsResourceUrl(url);

    var _getBlocks = function() {
      Blocks.get({
        limit: BLOCKS_DISPLAYED
      }, function(res) {
        $scope.blocks = res.blocks;
        $scope.blocksLength = res.length;
      });
    };

    var socket = getSocket($scope);

    var _startSocket = function() {
      socket.emit('subscribe', 'inv');
      socket.on('tx', function(tx) {
        $scope.txs.unshift(tx);
        if (parseInt($scope.txs.length, 10) >= parseInt(TRANSACTION_DISPLAYED, 10)) {
          $scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED);
        }
      });

      socket.on('block', function() {
        _getBlocks();
      });
    };

    socket.on('connect', function() {
      _startSocket();
    });



    $scope.humanSince = function(time) {
      var m = moment.unix(time);
      return m.max().fromNow();
    };

    $scope.index = function() {
      _getBlocks();
      _startSocket();
    };

    $scope.txs = [];
    $scope.blocks = [];




    // Add an event listener for messages posted to this window
    window.addEventListener('message', receiveMessage, false);

    // Define the message handler function
    function receiveMessage(event) {

      // Make sure the message posted to this window is from Coinbase
      if (event.origin == 'https://www.coinbase.com') {
        var event_type = event.data.split('|')[0];     // "coinbase_payment_complete"
        var event_id   = event.data.split('|')[1];     // ID for this payment type

        if (event_type == 'coinbase_payment_complete') {
          getDownloadLink()
        }
        else if (event_type == 'coinbase_payment_mispaid') {
          alert('Payment mispaid for iFrame ' + event_id);
        }
        else if (event_type == 'coinbase_payment_expired') {
          alert('Payment expired for iFrame ' + event_id);
        }
        else {
          // Do something else, or ignore
        }
      }
    }


    function getDownloadLink() {
      var ioid = $cookies.io;
      console.log('ioid:', ioid);
    }

    function getCookie(name) {
      match = document.cookie.match(new RegExp(name + '=([^;]+)'));
      if (match) return match[1];
    }


  });

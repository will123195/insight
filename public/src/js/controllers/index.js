'use strict';

var TRANSACTION_DISPLAYED = 10;
var BLOCKS_DISPLAYED = 5;

angular.module('insight.system').controller('IndexController',
  function($scope, Global, getSocket, Blocks, $sce, $cookies) {
    $scope.global = Global;

    var _getBlocks = function() {
      Blocks.get({
        limit: BLOCKS_DISPLAYED
      }, function(res) {
        $scope.blocks = res.blocks;
        $scope.blocksLength = res.length;
      });
    };

    var socket = getSocket($scope);

    var scopedSocket = getSocket($scope);
    console.log('scopedSocket:', scopedSocket)
    var id = scopedSocket.socket.io.engine.id;
    console.log('id:', id);

    var id = getId();
    console.log('id::', id);
    var url = 'https://www.coinbase.com/checkouts/0f512df0ae702a4e52f1a91e5823b736/inline?c=' + id;
    $scope.iframeUrl = $sce.trustAsResourceUrl(url);

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

    socket.on('connect', function(x) {
      console.log('x:', x)
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
      console.log('c:', getId());
    }

    function getId() {
      var scopedSocket = getSocket($scope);
      console.log('scopedSocket:', scopedSocket)
      var id = scopedSocket.socket.io.engine.id;
      console.log('id:', id);
      return id;
    }


  }
);

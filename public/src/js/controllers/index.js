'use strict';

var TRANSACTION_DISPLAYED = 10;
var BLOCKS_DISPLAYED = 5;

var coinbaseCheckoutId = '8fc897856106f956b12d1ff74315a340';

angular.module('insight.system').controller('IndexController',
  function($scope, Global, getSocket, Blocks, $sce, $http, $cookies) {
    $scope.global = Global;

    $scope.downloadLink = $cookies.downloadLink || '*** Please submit payment ***';

    var _getBlocks = function() {
      Blocks.get({
        limit: BLOCKS_DISPLAYED
      }, function(res) {
        $scope.blocks = res.blocks;
        $scope.blocksLength = res.length;
      });
    };

    var socket = getSocket($scope);

    showiFrame();

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

      showiFrame();

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
          getDownloadLink();
        }
        else if (event_type == 'coinbase_payment_mispaid') {

        }
        else if (event_type == 'coinbase_payment_expired') {

        }
        else {
          // Do something else, or ignore
        }
      }
    }


    function getDownloadLink() {
      var url = 'http://bitcoin.equipment/get-blockchain-download-url.php?c=' + getId();
      $http.get(url)
        .success(function(data, status, headers, config) {
          $scope.downloadLink = data.url;
          $cookies.downloadLink = data.url;
        })
        .error(function(data, status, headers, config) {
          console.log('We could not verify your order. Reference # ' + getId());
        });
    }

    function getId() {
      return getSocket($scope).socket.io.engine.id;
    }

    function showiFrame() {
      if (getId()) {
        var url = 'https://www.coinbase.com/checkouts/' + coinbaseCheckoutId + '/inline?c=' + getId();
        $scope.iframeUrl = $sce.trustAsResourceUrl(url);
        $scope.iframeId = 'coinbase_inline_iframe_' + coinbaseCheckoutId;
      }
    }


  }
);

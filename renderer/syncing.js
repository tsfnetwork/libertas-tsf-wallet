// In renderer process (web page).
const {ipcRenderer} = require('electron');
var web3;

// Set the provider you want from Web3.providers
SyncProgress = new ProgressBar.Line('#syncProgress',
{
  strokeWidth: 6,
  easing: 'easeInOut',
  duration: 1400,
  color: "#1b87d4",
  trailColor: '#eee',
  trailWidth: 1,
  text: {
    style: {
      color: '#fff',
      position: "absolute",
      left: "50%",
      top: "-1px",
      transform: "translateX(-50%)",
      fontSize: "0.9em",
      LineHeight: "24px",
      padding: 0
    },
    autoStyleContainer: false
  },
  from: {color: '#fff'},
  to: {color: '#1b87d4'}
});

// set initial value for the progress text
SyncProgress.setText("Waiting for blockchain, please wait...");
isFullySynced = false;

var peerCountInterval = setInterval(function()
{
  web3Local.eth.net.getPeerCount(function(error, count) {
    $("#peerCount").html(vsprintf("Peer Count: %d", [count]));
  });
}, 5000);

function StartSyncProcess() {
  var alreadyCatchedUp = false;
  var nodeSyncInterval = null;

  var subscription = web3Local.eth.subscribe('syncing', function(error, sync){
    if (!error) {
      if (!sync) {
        if (nodeSyncInterval) {
          clearInterval(nodeSyncInterval);
        }

        nodeSyncInterval = setInterval(function()
        {
          web3Local.eth.getBlock("latest", function(error, localBlock) {
            if (!error) {
              if (localBlock.number > 0) {
                if (!TSFTransactions.getIsSyncing()) {
                  SyncProgress.animate(1);
                  SyncProgress.setText(vsprintf('%d/%d (100%%)', [localBlock.number, localBlock.number]));
                }

                if (alreadyCatchedUp == false) {
                  console.log("alreadyCatchedUp false");
                  // clear the repeat interval and render wallets
                  $(document).trigger("onNewAccountTransaction");
                  alreadyCatchedUp = true;
                  isFullySynced = true;
                  console.log(alreadyCatchedUp);
                  console.log(isFullySynced);
                  // enable the keep in sync feature
                  TSFTransactions.enableKeepInSync();
                  // sync all the transactions to the current block
                  TSFTransactions.syncTransactionsForAllAddresses(localBlock.number);

                  // signal that the sync is complete
                  $(document).trigger("onSyncComplete");
                }
              }
            } else {
              TSFMainGUI.showGeneralError(error);
            }
          });
        }, 10000);
      }
    } else {
      TSFMainGUI.showGeneralError(error);
    }
  }).on("data", function(sync){
    if ((sync) && (sync.HighestBlock > 0)) {
      console.log("sync");
      SyncProgress.animate(sync.CurrentBlock / sync.HighestBlock);
      SyncProgress.setText(vsprintf('%d/%d (%d%%)', [sync.CurrentBlock, sync.HighestBlock, Math.floor(sync.CurrentBlock / sync.HighestBlock * 100)]));
    }
  }).on("changed", function(isSyncing){
    console.log("changed");
    if(isSyncing) {
      console.log("isSyncing");
      nodeSyncInterval = setInterval(function()
      {
        web3Local.eth.isSyncing(function(error, sync){
          if ((!error) && (sync)) {
            console.log("sync11111");
            SyncProgress.animate(sync.currentBlock / sync.highestBlock);
            SyncProgress.setText(vsprintf('%d/%d (%d%%)', [sync.currentBlock, sync.highestBlock, Math.floor(sync.currentBlock / sync.highestBlock * 100)]));
          } else if (error) {
            TSFMainGUI.showGeneralError(error);
          }
        });
      }, 2000);
    } else {
      if (nodeSyncInterval) {
        console.log("nodeSyncInterval");
        clearInterval(nodeSyncInterval);
      }
    }
  });
}

var InitWeb3 = setInterval(function()
{
  try {
    web3Local = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:4950'));
    console.log(web3Local);

    web3Local.eth.net.isListening(function(error, success) {
      if (!error) {
        $(document).trigger("onGtsfReady");
        clearInterval(InitWeb3);
        StartSyncProcess();
      }
    });
  }
  catch(err) {
    TSFMainGUI.showGeneralError(err);
  }
}, 2000);

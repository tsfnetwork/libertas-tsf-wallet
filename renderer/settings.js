// In renderer process (web page).
const {ipcRenderer} = require('electron');

class Settings {
    constructor() {}

    renderSettingsState() {
        TSFMainGUI.renderTemplate("settings.html", {});
        $(document).trigger("render_settings");
    }
}

$(document).on("render_settings", function() {
    $("#btnSettingsCleanTransactions").off('click').on('click', function() {
        if (isFullySynced) {
            TSFMainGUI.showGeneralConfirmation("Do you really want to resync transactions?", function(result) {
                if (result) {
                    if (TSFTransactions.getIsSyncing()) {
                        TSFMainGUI.showGeneralError("Transactions sync is currently in progress");
                    } else {
                        // first disable keepInSync
                        TSFTransactions.disableKeepInSync();
                        // then delete the transactions data
                        var counters = TSFDatatabse.getCounters();
                        counters.transactions = 0;
                        TSFDatatabse.setCounters(counters);
                        ipcResult = ipcRenderer.sendSync('deleteTransactions', null);

                        if (ipcResult.success) {
                            // sync all the transactions to the current block
                            web3Local.eth.getBlock("latest", function(error, localBlock) {
                                if (error) {
                                    TSFMainGUI.showGeneralError(error);
                                } else {
                                    TSFTransactions.enableKeepInSync();
                                    TSFTransactions.syncTransactionsForAllAddresses(localBlock.number);

                                    iziToast.success({
                                        title: 'Success',
                                        message: 'Transactions are being resynced',
                                        position: 'topRight',
                                        timeout: 5000
                                    });
                                }
                            });
                        } else {
                            TSFMainGUI.showGeneralError("Error resyncing transactions: " + ipcResult.error);
                        }
                    }
                }
            });
        } else {
            iziToast.info({
                title: 'Wait...',
                message: 'You need to be fully sync before cleaning transactions',
                position: 'topRight',
                timeout: 5000
            });
        }
    });

    $("#btnSettingsCleanWallets").off('click').on('click', function() {
        TSFMainGUI.showGeneralConfirmation("Do you really want to delete wallets data?", function(result) {
            if (result) {
                ipcResult = ipcRenderer.sendSync('deleteWalletData', null);

                if (ipcResult.success) {
                    iziToast.success({
                        title: 'Success',
                        message: 'Wallet names were succesfully cleaned',
                        position: 'topRight',
                        timeout: 5000
                    });             
                } else {
                    TSFMainGUI.showGeneralError("Error clearing wallet names: " + ipcResult.error);  
                }
            }
        });
    });

    $("#btnSettingsCleanBlockchain").off('click').on('click', function() {
        TSFMainGUI.showGeneralConfirmation("Do you really want to delete the blockchain data? Wallet will close and you will need to restart it!", function(result) {
            if (result) {                
                var loading_screen = pleaseWait({
                    logo: "assets/images/logo.png",
                    backgroundColor: '#000000',
                    loadingHtml: "<div class='spinner'><div class='bounce bounce1'></div><div class='bounce bounce2'></div><div class='bounce bounce3'></div></div><div class='loadingText'>Deleting blockchain data, wallet will automatically close, please wait...</div>"
                });

                setTimeout(() => {
                    // first stop the geth process
                    ipcResult = ipcRenderer.send('stopGtsf', null);

                    setTimeout(() => {
                        // delete the blockchain date async and wait for 5 seconds
                        ipcResult = ipcRenderer.sendSync('deleteBlockchainData', null);
                        // finally quit the application
                        ipcResult = ipcRenderer.send('appQuit', null);                    
                    }, 5000);
                }, 2000);
            }
        });
    });
});

// create new account variable
TSFSettings = new Settings();

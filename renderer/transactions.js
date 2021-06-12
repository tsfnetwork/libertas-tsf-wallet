const {
    ipcRenderer
} = require('electron');

class Transactions {
    constructor() {
        this.filter = "";
        this.isSyncing = false;
        this.isLoading = false;
    }

    setIsSyncing(value) {
        this.isSyncing = value;
    }

    getIsSyncing() {
        return this.isSyncing;
    }

    setIsLoading(value) {
        this.isLoading = value;
    }

    getIsLoading() {
        return this.isLoading;
    }

    setFilter(text) {
        this.filter = text;
    }

    getFilter() {
        return this.filter;
    }

    clearFilter() {
        this.filter = "";
    }

    // syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter) {
    syncTransactionsForSingleAddress(addressList, counters, counter) {
        if (counter < addressList.length) {
            SyncProgress.setText(vsprintf("Syncing address transactions %d/%d, please wait...", [counter, addressList.length]));

            var startBlock = parseInt(counters.transactions) || 0;
            // var params = vsprintf('?address=%s&fromBlock=%d&toBlock=%d', [addressList[counter].toLowerCase(), startBlock, lastBlock]);
            var params = vsprintf('%s', [addressList[counter].toLowerCase()]);

            $.getJSON("https://explorer.tsf-platform.com/api/v1/address/tx/" + params + "/10/1", function (result) {
                result.forEach(element => {
                    var amount = parseFloat(element.value);
                    var timeS = element.timestamp;
                    if (element.from && element.to) {
                        ipcRenderer.send('storeTransaction', {
                            block: element.blockNumber.toString(),
                            txhash: element.hash.toLowerCase(),
                            fromaddr: element.from.toLowerCase(),
                            timestamp: element.timestamp,
                            toaddr: element.to.toLowerCase(),
                            value: amount
                        });
                    }
                });

                // call the transaction sync for the next address
                TSFTransactions.syncTransactionsForSingleAddress(addressList, counters, counter + 1);
            });
        } else {
            // update the counter and store it back to file system
            // counters.transactions = lastBlock;
            TSFDatatabse.setCounters(counters);

            SyncProgress.setText("Syncing transactions is complete.");
            TSFTransactions.setIsSyncing(false);
        }
    }

    syncTransactionsForAllAddresses(lastBlock) {
        var counters = TSFDatatabse.getCounters();
        var counter = 0;

        TSFBlockchain.getAccounts(
            function (error) {
                TSFMainGUI.showGeneralError(error);
            },
            function (data) {
                TSFTransactions.setIsSyncing(true);
                TSFTransactions.syncTransactionsForSingleAddress(data, counters, counter);
            }
        );
    }

    renderTransactions() {
        if (!TSFTransactions.getIsLoading()) {
            TSFMainGUI.renderTemplate("transactions.html", {});
            $(document).trigger("render_transactions");
            TSFTransactions.setIsLoading(true);

            // show the loading overlay for transactions
            $("#loadingTransactionsOverlay").css("display", "block");

            setTimeout(() => {
                var dataTransactions = ipcRenderer.sendSync('getTransactions');
                var addressList = TSFWallets.getAddressList();

                dataTransactions.forEach(function (element) {
                    var isFromValid = (addressList.indexOf(element[2].toLowerCase()) > -1);
                    var isToValid = (addressList.indexOf(element[3].toLowerCase()) > -1);

                    if ((isToValid) && (!isFromValid)) {
                        element.unshift(0);
                    } else if ((!isToValid) && (isFromValid)) {
                        element.unshift(1);
                    } else {
                        element.unshift(2);
                    }
                });

                TSFTableTransactions.initialize('#tableTransactionsForAll', dataTransactions);
                TSFTransactions.setIsLoading(false);
            }, 200);
        }
    }

    enableKeepInSync() {
        TSFBlockchain.subsribeNewBlockHeaders(
            function (error) {
                TSFMainGUI.showGeneralError(error);
            },
            function (data) {
                TSFBlockchain.getBlock(data.number, true,
                    function (error) {
                        TSFMainGUI.showGeneralError(error);
                    },
                    function (data) {
                        if (data.transactions) {
                            data.transactions.forEach(element => {

                                if (element.from && element.to) {
                                    if ((TSFWallets.getAddressExists(element.from)) || (TSFWallets.getAddressExists(element.to))) {
                                        console.log(element);
                                        var amount = element.value;
                                        var amountInEther = web3Local.utils.fromWei(amount.toString(), 'ether');
                                        var Transaction = {
                                            block: element.blockNumber.toString(),
                                            txhash: element.hash.toLowerCase(),
                                            fromaddr: element.from.toLowerCase(),
                                            timestamp: moment(element.timestamp).format("DD MMM YYYY[\r\n]hh:mm a"),
                                            toaddr: element.to.toLowerCase(),
                                            value: amountInEther
                                        }
                                        console.log(Transaction);
                                        // store transaction and notify about new transactions
                                        ipcRenderer.send('storeTransaction', Transaction);
                                        $(document).trigger("onNewAccountTransaction");

                                        iziToast.info({
                                            title: 'New Transaction',
                                            message: vsprintf('Transaction from address %s to address %s was just processed', [Transaction.fromaddr, Transaction.toaddr]),
                                            position: 'topRight',
                                            timeout: 10000
                                        });

                                        if (TSFMainGUI.getAppState() == "transactions") {
                                            setTimeout(function () {
                                                TSFTransactions.renderTransactions();
                                            }, 500);
                                        }
                                    }
                                }
                            });
                        }
                    }
                );
            }
        );
    }

    disableKeepInSync() {
        TSFBlockchain.unsubsribeNewBlockHeaders(
            function (error) {
                TSFMainGUI.showGeneralError(error);
            },
            function (data) {
                // success
            }
        );
    }
}

// create new transactions variable
TSFTransactions = new Transactions();
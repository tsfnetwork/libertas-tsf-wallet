// In renderer process (web page).
const {
    ipcRenderer
} = require('electron');

class SendTransaction {
    constructor() {}

    enableSendButtonTooltips() {
        TSFUtils.createToolTip("#btnAddToAddressBook", "Add this Address to AddressBook");
        TSFUtils.createToolTip("#btnLookForToAddress", "Look for Existing Address");
    }

    renderSendState() {
        TSFBlockchain.getAccountsData(
            function (error) {
                TSFMainGUI.showGeneralError(error);
            },
            function (data) {
                TSFMainGUI.renderTemplate("send.html", data);
                $(document).trigger("render_send");
            }
        );

    }

    validateSendForm() {
        if (TSFMainGUI.getAppState() == "send") {
            let currentAddr = $("#sendFromAddress").val();
            console.log(currentAddr);
            if (!$("#sendFromAddress").val()) {
                TSFMainGUI.showGeneralError("Sender address must be specified!");
                return false;
            }

            if (!TSFBlockchain.isAddress($("#sendFromAddress").val())) {
                TSFMainGUI.showGeneralError("Sender address must be a valid address!");
                return false;
            }

            if (!$("#sendToAddress").val()) {
                TSFMainGUI.showGeneralError("Recipient address must be specified!");
                return false;
            }

            if (!TSFBlockchain.isAddress($("#sendToAddress").val())) {
                TSFMainGUI.showGeneralError("Recipient address must be a valid address!");
                return false;
            }

            if (Number($("#sendAmmount").val()) <= 0) {
                TSFMainGUI.showGeneralError("Send amount must be greater then zero!");
                return false;
            }

            if (Number($("#sendAmmount").val()) > Number($("#tokenBalance").val())) {
                TSFMainGUI.showGeneralError("Send amount must be less then the total balance! Don't forget to leave some TSF for fee.");
                return false;
            }
            return true;
        } else {
            return false;
        }
    }

    resetSendForm() {
        if (TSFMainGUI.getAppState() == "send") {
            $("#sendToAddressName").html("");
            $("#sendToAddress").val("");
            $("#sendAmmount").val(0);
        }
    }
}

$(document).on("render_send", function () {
    $('select#sendFromAddress').formSelect({
        classes: "fromAddressSelect"
    });
    $('select#tokens').formSelect({
        classes: "tokenValue"
    });

    TSFSend.enableSendButtonTooltips();

    $("#btnSendAll").off('click').on('click', function () {
        $("#sendAmmount").focus();
        $("#sendAmmount").val($("#sendMaxAmmount").html());
    });

    $("#sendToAddress").off('input').on('input', function () {
        var addressName = null;
        $("#sendToAddressName").html("");
        addressName = TSFAddressBook.getAddressName($("#sendToAddress").val());

        if (!addressName) {
            var wallets = TSFDatatabse.getWallets();
            addressName = wallets.names[$("#sendToAddress").val()];
            console.log("addressName", addressName);
        }
        $("#sendToAddressName").html(addressName);
    });

    $("#sendFromAddress").off('change').on('change', function () {
        var optionText = $(this).find("option:selected").text();
        console.log(optionText);
        var addrName = optionText.substr(0, optionText.indexOf('-'));
        console.log(addrName);
        var addrValue = optionText.substr(optionText.indexOf("-") + 1).substring(1);
        console.log(addrValue);
        var addr42 = addrValue.slice(0, 42);
        console.log(addr42);
        var isTSFSelected = $("#tokens").find("option:selected").text();
        if (isTSFSelected === "TSF") {
            console.log("TSF");
            $("#tokenBalance").val(totalAmount);
        } else if (isTSFSelected === "BINAR") {
            console.log("BINAR");
            getBinarBalance(addr42);
        } else if (isTSFSelected === "SZAR") {
            console.log("SZAR");
            getSzarBalance(addr42);
        }
        // $.getJSON("https://explorer.tsf-platform.com/api/v1/address/tokenBalance/" + addr42,  function( result ) {
        //         console.log(result);
        //         var binarBal = result.balance.binar;
        //         console.log(binarBal);
        //         $("#binarBalanceHolder").html(binarBal);
        //         var szarBal = result.balance.szar;
        //         console.log(szarBal);
        //         $("#szarBalanceHolder").html(szarBal);
        //         var boltBal = result.balance.bolt;
        //         console.log(boltBal);
        //         $("#boltBalanceHolder").html(boltBal);
        //         var fusionBal = result.balance.fusion;
        //         console.log(fusionBal);
        //         $("#fusionBalanceHolder").html(fusionBal);
        //         // result.forEach(element => {
        //         //     var amount = parseFloat(element.value);
        //         //     console.log("amount", amount);
        //         //     var timeS = element.timestamp;
        //         //     console.log("timestamp", timeS);
        //         //      if (element.from && element.to) {
        //         //         ipcRenderer.send('storeTransaction', {
        //         //             block: element.blockNumber.toString(),
        //         //             txhash: element.hash.toLowerCase(),
        //         //             fromaddr: element.from.toLowerCase(),
        //         //             timestamp: element.timestamp,
        //         //             toaddr: element.to.toLowerCase(),
        //         //             value: amount
        //         //         });
        //         //     }
        //         // });

        //         // call the transaction sync for the next address
        //         // TSFTransactions.syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter + 1);

        // });
        function getBinarBalance(addr42) {
            var abi = [{
                "constant": true,
                "inputs": [{
                    "name": "_owner",
                    "type": "address"
                }],
                "name": "balanceOf",
                "outputs": [{
                    "name": "balance",
                    "type": "uint256"
                }],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            }];

            var contract = new web3Local.eth.Contract(abi, "0x407DC4E7D7b861CFe2122C34e6c8e7437F24ff9A");
            var binarHolder = addr42;
            contract.methods.balanceOf(binarHolder).call().then(function (binarBalanceTotal) {
                console.log(parseInt(binarBalanceTotal));
                $("#tokenBalance").val(binarBalanceTotal);
            });
        }

        function getSzarBalance(addr42) {
            var abi = [{
                "constant": true,
                "inputs": [{
                    "name": "_owner",
                    "type": "address"
                }],
                "name": "balanceOf",
                "outputs": [{
                    "name": "balance",
                    "type": "uint256"
                }],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            }];

            var contract = new web3Local.eth.Contract(abi, "0x16545038bffb6604a1113198d93b31fc72fb2d76");
            var szarHolder = addr42;
            contract.methods.balanceOf(szarHolder).call().then(function (szarBalanceTotal) {
                console.log(parseInt(szarBalanceTotal));
                $("#tokenBalance").val(szarBalanceTotal);
            });
        }
       
        var totalAmount = parseFloat(addrValue.trim().substring(45));
        console.log(totalAmount);
        $("#tokenBalance").val(totalAmount);
        $(".tokenValue input").html(totalAmount);

        $(".fromAddressSelect input").val(addrValue.trim().slice(0, 42));
        $("#sendFromAddressName").html(addrName.trim());

        $("#tokens").off('change').on('change', function () {
            var currencySelected = $(this).find("option:selected").text();
            console.log(currencySelected);
            if (currencySelected === "TSF") {
                console.log("TSF");
                $("#tokenBalance").val(totalAmount);

            } else if (currencySelected === "BINAR") {
                console.log("BINAR");
                getBinarBalance(addr42);
            } else if (currencySelected === "SZAR") {
                console.log("SZAR");
                getSzarBalance(addr42);
            }
        });
    });

    $("#btnLookForToAddress").off('click').on('click', function () {
        TSFBlockchain.getAddressListData(
            function (error) {
                TSFMainGUI.showGeneralError(error);
            },
            function (addressList) {
                var addressBook = TSFAddressBook.getAddressList();

                for (var key in addressBook) {
                    if (addressBook.hasOwnProperty(key)) {
                        var adddressObject = {};
                        adddressObject.address = key;
                        adddressObject.name = addressBook[key];
                        addressList.addressData.push(adddressObject);
                    }
                }

                $("#dlgAddressList").iziModal({
                    width: "800px"
                });
                TSFMainGUI.renderTemplate("addresslist.html", addressList, $("#dlgAddressListBody"));
                $('#dlgAddressList').iziModal('open');

                $(".btnSelectToAddress").off('click').on('click', function () {
                    $("#sendToAddressName").html($(this).attr('data-name'));
                    $("#sendToAddress").val($(this).attr('data-wallet'));
                    $('#dlgAddressList').iziModal('close');
                });

                $('#addressListFilter').off('input').on('input', function (e) {
                    TSFUtils.filterTable($("#addressTable"), $('#addressListFilter').val());
                });

                $("#btnClearSearchField").off('click').on('click', function () {
                    TSFUtils.filterTable($("#addressTable"), "");
                    $('#addressListFilter').val("")
                });
            }
        );
    });

    $("#btnAddToAddressBook").off('click').on('click', function () {
        if (TSFBlockchain.isAddress($("#sendToAddress").val())) {
            $("#dlgAddAddressToBook").iziModal();
            $("#inputAddressName").val("");
            $('#dlgAddAddressToBook').iziModal('open');

            function doAddAddressToAddressBook() {
                TSFAddressBook.setAddressName($("#sendToAddress").val(), $("#inputAddressName").val());
                $('#dlgAddAddressToBook').iziModal('close');

                iziToast.success({
                    title: 'Success',
                    message: 'Address was added to address book',
                    position: 'topRight',
                    timeout: 2000
                });
            }
        } else {
            TSFMainGUI.showGeneralError("Recipient address is not valid!");
        }

        $("#btnAddAddressToBookConfirm").off('click').on('click', function () {
            doAddAddressToAddressBook();
        });

        $("#dlgAddAddressToBook").off('keypress').on('keypress', function (e) {
            if (e.which == 13) {
                doAddAddressToAddressBook();
            }
        });
    });


    $("#btnSendTransaction").off('click').on('click', function () {
        if (TSFSend.validateSendForm()) {
            let tokenTransaction = false;
            var token = $("#tokens").find("option:selected").text();
            console.log(token);
            let contractAddress = '';
            if (token === "TSF") {
                console.log("TSF");
                tokenTransaction = false;
                contractAddress = $("#sendToAddress").val();
                console.log(contractAddress);
            } else if (token === "BINAR") {
                console.log("BINAR");
                tokenTransaction = true;
                contractAddress = '0x407DC4E7D7b861CFe2122C34e6c8e7437F24ff9A';
            } else if (token === "SZAR") {
                console.log("SZAR");
                tokenTransaction = true;
                contractAddress = '0x16545038bffb6604a1113198d93b31fc72fb2d76';
            }
            console.log(tokenTransaction);
            TSFBlockchain.getTranasctionFee($("#sendFromAddress").val(), contractAddress, $("#sendAmmount").val(),
                function (error) {
                    TSFMainGUI.showGeneralError(error);
                },
                function (data) {
                    $("#dlgSendWalletPassword").iziModal();
                    $("#walletPassword").val("");
                    $("#fromAddressInfo").html($("#sendFromAddress").val());
                    $("#toAddressInfo").html($("#sendToAddress").val());
                    $("#valueToSendInfo").html($("#sendAmmount").val());
                    $(".currencyTicker").html(token);
                    $("#feeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), 'ether')));
                    $('#dlgSendWalletPassword').iziModal('open');

                    function doSendTransaction() {
                        $('#dlgSendWalletPassword').iziModal('close');
                        if(tokenTransaction) {
                            console.log(token);
                            console.log(contractAddress);
                            TSFBlockchain.prepareTokenTransaction(
                                contractAddress,
                                $("#walletPassword").val(),
                                $("#sendFromAddress").val(),
                                $("#sendToAddress").val(),
                                $("#sendAmmount").val(),
                                function (error) {
                                    TSFMainGUI.showGeneralError(error);
                                },
                                function (data) {
                                    TSFBlockchain.sendTransaction(data.raw,
                                        function (error) {
                                            TSFMainGUI.showGeneralError(error);
                                        },
                                        function (data1) {
                                            TSFSend.resetSendForm();
                                            console.log("data1-txhash", data1);
                                            iziToast.success({
                                                title: 'Sent',
                                                message: 'Transaction was successfully sent to the chain',
                                                position: 'topRight',
                                                timeout: 5000
                                            });
    
                                            TSFBlockchain.getTransaction(data1,
                                                function (error) {
                                                    TSFMainGUI.showGeneralError(error);
                                                },
                                                function (transaction) {
                                                    console.log("transaction", transaction);
                                                    var amount = web3Local.utils.fromWei(transaction.value, 'ether');
                                                    console.log(amount);
                                                    var timeTx = transaction.timestamp;
                                                    console.log(timeTx);
                                                    ipcRenderer.send('storeTransaction', {
                                                        block: transaction.blockNumber,
                                                        txhash: transaction.hash.toLowerCase(),
                                                        fromaddr: transaction.from.toLowerCase(),
                                                        timestamp: timeTx,
                                                        toaddr: transaction.to.toLowerCase(),
                                                        value: amount
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        } else if (token === "TSF") {
                            console.log("sending tsf");
                            TSFBlockchain.prepareTransaction(
                                $("#walletPassword").val(),
                                $("#sendFromAddress").val(),
                                $("#sendToAddress").val(),
                                $("#sendAmmount").val(),
                                function (error) {
                                    TSFMainGUI.showGeneralError(error);
                                },
                                function (data) {
                                    TSFBlockchain.sendTransaction(data.raw,
                                        function (error) {
                                            TSFMainGUI.showGeneralError(error);
                                        },
                                        function (data1) {
                                            TSFSend.resetSendForm();
                                            console.log("data1-txhash", data1);
                                            iziToast.success({
                                                title: 'Sent',
                                                message: 'Transaction was successfully sent to the chain',
                                                position: 'topRight',
                                                timeout: 5000
                                            });
    
                                            TSFBlockchain.getTransaction(data1,
                                                function (error) {
                                                    TSFMainGUI.showGeneralError(error);
                                                },
                                                function (transaction) {
                                                    console.log("transaction", transaction);
                                                    var amount = web3Local.utils.fromWei(transaction.value, 'ether');
                                                    console.log(amount);
                                                    var timeTx = transaction.timestamp;
                                                    console.log(timeTx);
                                                    ipcRenderer.send('storeTransaction', {
                                                        block: transaction.blockNumber,
                                                        txhash: transaction.hash.toLowerCase(),
                                                        fromaddr: transaction.from.toLowerCase(),
                                                        timestamp: timeTx,
                                                        toaddr: transaction.to.toLowerCase(),
                                                        value: amount
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    }

                    $("#btnSendWalletPasswordConfirm").off('click').on('click', function () {
                        doSendTransaction();
                    });

                    $("#dlgSendWalletPassword").off('keypress').on('keypress', function (e) {
                        if (e.which == 13) {
                            doSendTransaction();
                        }
                    });
                }
            );
        }
    });
});

// create new account variable
TSFSend = new SendTransaction();
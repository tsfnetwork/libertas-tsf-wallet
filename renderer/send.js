// In renderer process (web page).
const {ipcRenderer} = require('electron');

class SendTransaction {
    constructor() {}

     enableSendButtonTooltips() {
        TSFUtils.createToolTip("#btnAddToAddressBook", "Add this Address to AddressBook");
        TSFUtils.createToolTip("#btnLookForToAddress", "Look for Existing Address");
      }

    renderSendState() {
        TSFBlockchain.getAccountsData(
            function(error) {
              TSFMainGUI.showGeneralError(error);
            },
            function(data) {
                TSFMainGUI.renderTemplate("send.html", data);
                $(document).trigger("render_send");
            }
        );

    }

    validateSendForm() {
        if (TSFMainGUI.getAppState() == "send") {
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
                TSFMainGUI.showGeneralError("Send ammount must be greater then zero!");
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

$(document).on("render_send", function() {
    $('select').formSelect( {classes: "fromAddressSelect"});

    // $("#sendFromAddress").on("change", function() {
    //     web3Local.eth.getBalance(this.value, function(error, balance) {
    //         console.log(this.value);
    //         $("#sendMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, 'ether')));
    //     });
    // });

    // $("#sendFromAddressName").off('change').on('change', function() {
    //     console.log("clicksendfromaddr");
    //     web3Local.eth.getBalance(this.value, function(error, balance) {
    //         console.log(this.value);
    //         $("#sendMaxAmmount").html(parseFloat(web3Local.utils.fromWei(balance, 'ether')));
    //     });
    // });
    TSFSend.enableSendButtonTooltips();

    $("#btnSendAll").off('click').on('click', function() {
        $("#sendAmmount").focus();
        $("#sendAmmount").val($("#sendMaxAmmount").html());
    });

    $("#sendToAddress").off('input').on('input', function() {
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

    $("#sendFromAddress").off('change').on('change', function() {
        var optionText = $(this).find("option:selected").text();
        console.log(optionText);
        var addrName = optionText.substr(0, optionText.indexOf('-'));
        console.log(addrName); 
        var addrValue = optionText.substr(optionText.indexOf("-") + 1).substring(1);
        console.log(addrValue);
        var totalAmount = addrValue.trim().substring(45);
        console.log(totalAmount);
        $("#sendMaxAmmount").html(totalAmount);
        $(".fromAddressSelect input").val(addrValue.trim().slice(0,42));  
        $("#sendFromAddressName").html(addrName.trim());          
    });       

    $("#btnLookForToAddress").off('click').on('click', function() {
        TSFBlockchain.getAddressListData(
            function(error) {
              TSFMainGUI.showGeneralError(error);
            },
            function(addressList) {
                var addressBook = TSFAddressBook.getAddressList();

                for (var key in addressBook) {
                    if (addressBook.hasOwnProperty(key)) {
                        var adddressObject = {};
                        adddressObject.address = key;
                        adddressObject.name = addressBook[key];
                        addressList.addressData.push(adddressObject);
                    }
                }

                $("#dlgAddressList").iziModal({ width: "800px" });
                TSFMainGUI.renderTemplate("addresslist.html", addressList, $("#dlgAddressListBody"));
                $('#dlgAddressList').iziModal('open');

                $(".btnSelectToAddress").off('click').on('click', function() {
                    $("#sendToAddressName").html($(this).attr('data-name'));
                    $("#sendToAddress").val($(this).attr('data-wallet'));
                    $('#dlgAddressList').iziModal('close');
                });

                $('#addressListFilter').off('input').on('input',function(e){
                    TSFUtils.filterTable($("#addressTable"), $('#addressListFilter').val());
                });

                $("#btnClearSearchField").off('click').on('click', function() {
                    TSFUtils.filterTable($("#addressTable"), "");
                    $('#addressListFilter').val("")
                });
            }
        );
    });

    $("#btnAddToAddressBook").off('click').on('click', function() {
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

        $("#btnAddAddressToBookConfirm").off('click').on('click', function() {
            doAddAddressToAddressBook();
        });

        $("#dlgAddAddressToBook").off('keypress').on('keypress', function(e) {
            if(e.which == 13) {
                doAddAddressToAddressBook();
            }
        });
    });


    $("#btnSendTransaction").off('click').on('click', function() {
        if (TSFSend.validateSendForm()) {
            TSFBlockchain.getTranasctionFee($("#sendFromAddress").val(), $("#sendToAddress").val(), $("#sendAmmount").val(),
                function(error) {
                    TSFMainGUI.showGeneralError(error);
                },
                function(data) {
                    $("#dlgSendWalletPassword").iziModal();
                    $("#walletPassword").val("");
                    $("#fromAddressInfo").html($("#sendFromAddress").val());
                    $("#toAddressInfo").html($("#sendToAddress").val());
                    $("#valueToSendInfo").html($("#sendAmmount").val());
                    $("#feeToPayInfo").html(parseFloat(web3Local.utils.fromWei(data.toString(), 'ether')));
                    $('#dlgSendWalletPassword').iziModal('open');

                    function doSendTransaction() {
                        $('#dlgSendWalletPassword').iziModal('close');

                        TSFBlockchain.prepareTransaction(
                            $("#walletPassword").val(),
                            $("#sendFromAddress").val(),
                            $("#sendToAddress").val(),
                            $("#sendAmmount").val(),
                            function(error) {
                                TSFMainGUI.showGeneralError(error);
                            },
                            function(data) {
                                TSFBlockchain.sendTransaction(data.raw,
                                    function(error) {
                                        TSFMainGUI.showGeneralError(error);
                                    },
                                    function(data) {
                                        TSFSend.resetSendForm();

                                        iziToast.success({
                                            title: 'Sent',
                                            message: 'Transaction was successfully sent to the chain',
                                            position: 'topRight',
                                            timeout: 5000
                                        });

                                        TSFBlockchain.getTransaction(data,
                                            function(error) {
                                                TSFMainGUI.showGeneralError(error);
                                            },
                                            function(transaction) {
                                                console.log(transaction);
                                                var amount = parseFloat(transaction.value);
                                                var timeTx = transaction.timestamp;
                                                ipcRenderer.send('storeTransaction', {
                                                    block: transaction.blockNumber,
                                                    txhash: transaction.hash.toLowerCase(),
                                                    fromaddr: transaction.from.toLowerCase(),
                                                    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
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

                    $("#btnSendWalletPasswordConfirm").off('click').on('click', function() {
                        doSendTransaction();
                    });

                    $("#dlgSendWalletPassword").off('keypress').on('keypress', function(e) {
                        if(e.which == 13) {
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

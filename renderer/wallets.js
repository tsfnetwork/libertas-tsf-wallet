const {ipcRenderer} = require('electron');

class Wallets {
  constructor() {
    this.addressList = [];
    this.price = null;

    $.getJSON("https://api.coingecko.com/api/v3/simple/price?ids=teslafunds&vs_currencies=usd", function( price )
    {
      TSFWallets._setPrice(price['teslafunds'].usd);
    });
  }

  _getPrice() {
    return this.price;
  }

  _setPrice(price) {
    this.price = price;
  }

  getAddressList() {
    return this.addressList;
  }

  clearAddressList() {
    this.addressList = [];
  }

  getAddressExists(address) {
    if (address) {
      return this.addressList.indexOf(address.toLowerCase()) > -1;
    } else {
      return false;
    }
  }

  addAddressToList(address) {
    if (address) {
      this.addressList.push(address.toLowerCase());
    }
  }

  enableButtonTooltips() {
    TSFUtils.createToolTip("#btnNewAddress", "Create New Address");
    TSFUtils.createToolTip("#btnRefreshAddress", "Refresh Address List");
    TSFUtils.createToolTip("#btnExportAccounts", "Export Accounts");
    TSFUtils.createToolTip("#btnImportAccounts", "Import Accounts");
    TSFUtils.createToolTip("#btnImportFromPrivateKey", "Import From Private Key");
  }

  validateNewAccountForm() {
    if (TSFMainGUI.getAppState() == "account") {
        if (!$("#walletPasswordFirst").val()) {
            TSFMainGUI.showGeneralError("Password cannot be empty!");
            return false;
        }

        if (!$("#walletPasswordSecond").val()) {
          TSFMainGUI.showGeneralError("Password cannot be empty!");
          return false;
        }

        if ($("#walletPasswordFirst").val() !== $("#walletPasswordSecond").val()) {
            TSFMainGUI.showGeneralError("Passwords do not match!");
            return false;
        }

        return true;
    } else {
        return false;
    }
}

validateImportFromKeyForm() {
    if (TSFMainGUI.getAppState() == "account") {
      if (!$("#inputPrivateKey").val()) {
        TSFMainGUI.showGeneralError("Private key cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordFirst").val()) {
        TSFMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordSecond").val()) {
        TSFMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if ($("#keyPasswordFirst").val() !== $("#keyPasswordSecond").val()) {
        TSFMainGUI.showGeneralError("Passwords do not match!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }


renderWalletsState() {
    // clear the list of addresses
    TSFWallets.clearAddressList();

    TSFBlockchain.getAccountsData(
      function(error) {
        TSFMainGUI.showGeneralError(error);
      },
      function(data) {
        data.addressData.forEach(element => {
          TSFWallets.addAddressToList(element.address);
        });

        // render the wallets current state
        TSFMainGUI.renderTemplate("wallets.html", data);
        $(document).trigger("render_wallets");
        TSFWallets.enableButtonTooltips();

        $("#labelSumDollars").html(vsprintf("/ %.2f $ &nbsp;&nbsp;&nbsp;&nbsp;Price TSF/USD %.4f $", [data.sumBalance * TSFWallets._getPrice(), TSFWallets._getPrice()]));
      }
    );
  }
}

// the event to tell us that the wallets are rendered
$(document).on("render_wallets", function() {
   if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }

  $("#btnNewAddress").off('click').on('click', function() {
    $("#dlgCreateWalletPassword").iziModal();
    $("#walletPasswordFirst").val("");
    $("#walletPasswordSecond").val("");
    $('#dlgCreateWalletPassword').iziModal('open');

    function doCreateNewWallet() {
      $('#dlgCreateWalletPassword').iziModal('close');

      if (TSFWallets.validateNewAccountForm()) {
        TSFBlockchain.createNewAccount($("#walletPasswordFirst").val(),
          function(error) {
            TSFMainGUI.showGeneralError(error);
          },
          function(account) {
            TSFWallets.addAddressToList(account);
            TSFWallets.renderWalletsState();

            iziToast.success({
              title: 'Created',
              message: 'New wallet was successfully created',
              position: 'topRight',
              timeout: 5000
            });
          }
        );
      }
    }

    $("#btnCreateWalletConfirm").off('click').on('click', function() {
      doCreateNewWallet();
    });

    $("#dlgCreateWalletPassword").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doCreateNewWallet();
      }
    });
  });

  $(".btnShowAddressTransactions").off('click').on('click', function() {
    TSFTransactions.setFilter($(this).attr('data-wallet'));
    TSFMainGUI.changeAppState("transactions");
    TSFTransactions.renderTransactions();
  });

  $(".btnShowQRCode").off("click").on("click", function () {
    var QRCodeAddress = $(this).attr("data-address");
    $("#dlgShowAddressQRCode").iziModal();
    $("#addrQRCode").html("");
    $("#addrQRCode").qrcode(QRCodeAddress);
    $("#dlgShowAddressQRCode").iziModal("open");

    $("#btnScanQRCodeClose").off("click").on("click", function () {
      $("#dlgShowAddressQRCode").iziModal("close");
    });
  });

  $(".btnChangWalletName").off('click').on('click', function() {
    var walletAddress = $(this).attr('data-wallet');
    var walletName = $(this).attr('data-name');

    $("#dlgChangeWalletName").iziModal();
    $("#inputWalletName").val(walletName);
    $('#dlgChangeWalletName').iziModal('open');

    function doChangeWalletName() {
      var wallets = TSFDatatabse.getWallets();

      // set the wallet name from the dialog box
      wallets.names[walletAddress] = $("#inputWalletName").val();
      TSFDatatabse.setWallets(wallets);

      $('#dlgChangeWalletName').iziModal('close');
      TSFWallets.renderWalletsState();
    }

    $("#btnChangeWalletNameConfirm").off('click').on('click', function() {
      doChangeWalletName();
    });

    $("#dlgChangeWalletName").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doChangeWalletName();
      }
    });
  });

  $("#btnRefreshAddress").off('click').on('click', function() {
    TSFWallets.renderWalletsState();
  });

  $("#btnExportAccounts").off('click').on('click', function() {
    ipcRenderer.send('exportAccounts', {});
  });

  $("#btnImportAccounts").off('click').on('click', function() {
    var ImportResult = ipcRenderer.sendSync('importAccounts', {});

    if (ImportResult.success) {
      iziToast.success({
        title: 'Imported',
        message: ImportResult.text,
        position: 'topRight',
        timeout: 2000
      });
    } else if (ImportResult.success == false) {
      TSFMainGUI.showGeneralError(ImportResult.text);
    }

  });

  $("#btnImportFromPrivateKey").off('click').on('click', function() {
    $("#dlgImportFromPrivateKey").iziModal();
    $("#inputPrivateKey").val("");
    $('#dlgImportFromPrivateKey').iziModal('open');

    function doImportFromPrivateKeys() {
      // var account = TSFBlockchain.importFromPrivateKey($("#inputPrivateKey").val());
      $('#dlgImportFromPrivateKey').iziModal('close');

      // if (account) {
      //   ipcRenderer.sendSync('saveAccount', account[0]);
      //   TSFWallets.renderWalletsState();

      //   iziToast.success({
      //     title: 'Imported',
      //     message: "Account was succesfully imported",
      //     position: 'topRight',
      //     timeout: 2000
      //   });

      // } else {
      //   TSFMainGUI.showGeneralError("Error importing account from private key!");
      // }
      if (TSFWallets.validateImportFromKeyForm()) {
        var account = TSFBlockchain.importFromPrivateKey($("#inputPrivateKey").val(), $("#keyPasswordFirst").val(), function (error) {
          TSFMainGUI.showGeneralError(error);
        }, function (account) {
          if (account) {
            TSFWallets.renderWalletsState();
            iziToast.success({title: "Imported", message: "Account was succesfully imported", position: "topRight", timeout: 2000});
          } else {
            TSFMainGUI.showGeneralError("Error importing account from private key!");
          }
        });
      }
    }

    $("#btnImportFromPrivateKeyConfirm").off('click').on('click', function() {
      doImportFromPrivateKeys();
    });

    $("#dlgImportFromPrivateKey").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doImportFromPrivateKeys();
      }
    });
  });

  $(".textAddress").off('click').on('click', function() {
    TSFMainGUI.copyToClipboard($(this).html());

    iziToast.success({
      title: 'Copied',
      message: 'Address was copied to clipboard',
      position: 'topRight',
      timeout: 2000
    });
  });
});

// event that tells us that geth is ready and up
$(document).on("onGtsfReady", function() {
  TSFMainGUI.changeAppState("account");
  TSFWallets.renderWalletsState();
});

$(document).on("onNewAccountTransaction", function() {
  if (TSFMainGUI.getAppState() == "account") {
    TSFWallets.renderWalletsState();
  }
});

TSFWallets = new Wallets();

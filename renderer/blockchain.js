// In renderer process (web page).
const {
    ipcRenderer
} = require('electron');

class Blockchain {
    constructor() {
        this.txSubscribe = null;
        this.bhSubscribe = null;
    }

    getBlock(blockToGet, includeData, clbError, clbSuccess) {
        web3Local.eth.getBlock(blockToGet, includeData, function (error, block) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(block);
            }
        });
    }

    getAccounts(clbError, clbSuccess) {
        web3Local.eth.getAccounts(function (err, res) {
            if (err) {
                clbError(err);
            } else {
                clbSuccess(res);
            }
        });
    }

    isAddress(address) {
        return web3Local.utils.isAddress(address);
    }

    getTransaction(thxid, clbError, clbSuccess) {
        web3Local.eth.getTransaction(thxid, function (error, result) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(result);
            }
        });
    }

    getTranasctionFee(fromAddress, toAddress, value, clbError, clbSuccess) {
        web3Local.eth.getTransactionCount(fromAddress, function (error, result) {
            if (error) {
                clbError(error);
            } else {
                var amountToSend = web3Local.utils.toWei(value, "ether"); //convert to wei value
                var RawTransaction = {
                    from: fromAddress,
                    to: toAddress,
                    value: amountToSend,
                    nonce: result
                };

                web3Local.eth.estimateGas(RawTransaction, function (error, result) {
                    if (error) {
                        clbError(error);
                    } else {
                        var usedGas = result + 1;
                        web3Local.eth.getGasPrice(function (error, result) {
                            if (error) {
                                clbError(error);
                            } else {
                                clbSuccess(result * usedGas);
                            }
                        });
                    }
                });
            }
        });
    }

    prepareTokenTransaction(contractAddress, password, fromAddress, toAddress, value, clbError, clbSuccess, ) {
        web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
                clbError("Wrong password for the selected address!");
            } else {
                web3Local.eth.getTransactionCount(fromAddress, 'pending', function (error, result) {
                    if (error) {
                        clbError(error);
                    } else {
                        // var amountToSend = web3Local.utils.toWei(value, "ether"); //convert to wei value
                        var amountToSend = value;
                        console.log(amountToSend);
                        var abi = [{
                                "constant": true,
                                "inputs": [],
                                "name": "name",
                                "outputs": [{
                                    "name": "",
                                    "type": "string"
                                }],
                                "payable": false,
                                "stateMutability": "view",
                                "type": "function"
                            },
                            {
                                "constant": false,
                                "inputs": [{
                                        "name": "_spender",
                                        "type": "address"
                                    },
                                    {
                                        "name": "_value",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "approve",
                                "outputs": [{
                                    "name": "",
                                    "type": "bool"
                                }],
                                "payable": false,
                                "stateMutability": "nonpayable",
                                "type": "function"
                            },
                            {
                                "constant": true,
                                "inputs": [],
                                "name": "totalSupply",
                                "outputs": [{
                                    "name": "",
                                    "type": "uint256"
                                }],
                                "payable": false,
                                "stateMutability": "view",
                                "type": "function"
                            },
                            {
                                "constant": false,
                                "inputs": [{
                                        "name": "_from",
                                        "type": "address"
                                    },
                                    {
                                        "name": "_to",
                                        "type": "address"
                                    },
                                    {
                                        "name": "_value",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "transferFrom",
                                "outputs": [{
                                    "name": "",
                                    "type": "bool"
                                }],
                                "payable": false,
                                "stateMutability": "nonpayable",
                                "type": "function"
                            },
                            {
                                "constant": true,
                                "inputs": [],
                                "name": "decimals",
                                "outputs": [{
                                    "name": "",
                                    "type": "uint8"
                                }],
                                "payable": false,
                                "stateMutability": "view",
                                "type": "function"
                            },
                            {
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
                            },
                            {
                                "constant": true,
                                "inputs": [],
                                "name": "symbol",
                                "outputs": [{
                                    "name": "",
                                    "type": "string"
                                }],
                                "payable": false,
                                "stateMutability": "view",
                                "type": "function"
                            },
                            {
                                "constant": false,
                                "inputs": [{
                                        "name": "_to",
                                        "type": "address"
                                    },
                                    {
                                        "name": "_value",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "transfer",
                                "outputs": [{
                                    "name": "",
                                    "type": "bool"
                                }],
                                "payable": false,
                                "stateMutability": "nonpayable",
                                "type": "function"
                            },
                            {
                                "constant": true,
                                "inputs": [{
                                        "name": "_owner",
                                        "type": "address"
                                    },
                                    {
                                        "name": "_spender",
                                        "type": "address"
                                    }
                                ],
                                "name": "allowance",
                                "outputs": [{
                                    "name": "",
                                    "type": "uint256"
                                }],
                                "payable": false,
                                "stateMutability": "view",
                                "type": "function"
                            },
                            {
                                "payable": true,
                                "stateMutability": "payable",
                                "type": "fallback"
                            },
                            {
                                "anonymous": false,
                                "inputs": [{
                                        "indexed": true,
                                        "name": "owner",
                                        "type": "address"
                                    },
                                    {
                                        "indexed": true,
                                        "name": "spender",
                                        "type": "address"
                                    },
                                    {
                                        "indexed": false,
                                        "name": "value",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "Approval",
                                "type": "event"
                            },
                            {
                                "anonymous": false,
                                "inputs": [{
                                        "indexed": true,
                                        "name": "from",
                                        "type": "address"
                                    },
                                    {
                                        "indexed": true,
                                        "name": "to",
                                        "type": "address"
                                    },
                                    {
                                        "indexed": false,
                                        "name": "value",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "Transfer",
                                "type": "event"
                            }
                        ];

                        let myContract = new web3Local.eth.Contract(abi, contractAddress);
                        console.log(myContract);
                        let data = myContract.methods.transfer(toAddress, amountToSend).encodeABI();
                        console.log("data", data);
                        var RawTransaction = {
                            nonce: web3Local.utils.toHex(result),
                            gasPrice: "0x3b9aca00",
                            gasLimit: web3Local.utils.toHex(200000),
                            from: fromAddress,
                            to: contractAddress,
                            value: "0x00",
                            data: data
                        };
                        console.log(RawTransaction);
                        web3Local.eth.estimateGas(RawTransaction, function (error, result) {
                            if (error) {
                                clbError(error);
                            } else {
                                RawTransaction.gas = result + 1;
                                web3Local.eth.getGasPrice(function (error, result) {
                                    if (error) {
                                        clbError(error);
                                    } else {
                                        RawTransaction.gasPrice = result;
                                        web3Local.eth.signTransaction(RawTransaction, fromAddress, function (error, result) {
                                            if (error) {
                                                clbError(error);
                                            } else {
                                                clbSuccess(result);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    prepareTransaction(password, fromAddress, toAddress, value, clbError, clbSuccess) {
        web3Local.eth.personal.unlockAccount(fromAddress, password, function (error, result) {
            if (error) {
                clbError("Wrong password for the selected address!");
            } else {
                web3Local.eth.getTransactionCount(fromAddress, 'pending', function (error, result) {
                    if (error) {
                        clbError(error);
                    } else {
                        var amountToSend = web3Local.utils.toWei(value, "ether"); //convert to wei value
                        var RawTransaction = {
                            from: fromAddress,
                            to: toAddress,
                            value: amountToSend,
                            nonce: result
                        };

                        web3Local.eth.estimateGas(RawTransaction, function (error, result) {
                            if (error) {
                                clbError(error);
                            } else {
                                RawTransaction.gas = result + 1;
                                web3Local.eth.getGasPrice(function (error, result) {
                                    if (error) {
                                        clbError(error);
                                    } else {
                                        RawTransaction.gasPrice = result;
                                        web3Local.eth.signTransaction(RawTransaction, fromAddress, function (error, result) {
                                            if (error) {
                                                clbError(error);
                                            } else {
                                                clbSuccess(result);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    sendTransaction(rawTransaction, clbError, clbSuccess) {
        web3Local.eth.sendSignedTransaction(rawTransaction, function (error, result) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(result);
            }
        });
    }

    getAccountsData(clbError, clbSuccess) {
        var rendererData = {};
        rendererData.sumBalance = 0;
        rendererData.addressData = [];

        var wallets = TSFDatatabse.getWallets();
        var counter = 0;

        web3Local.eth.getAccounts(function (err, res) {
            if (err) {
                clbError(err);
            } else {
                for (var i = 0; i < res.length; i++) {
                    var walletName = vsprintf("Account %d", [i + 1]);
                    if (wallets) {
                        walletName = wallets.names[res[i]] || walletName;
                    }

                    var addressInfo = {};
                    addressInfo.balance = 0;
                    addressInfo.binarBalance = 0;
                    addressInfo.szarBalance = 0;
                    addressInfo.address = res[i];
                    addressInfo.name = walletName;
                    rendererData.addressData.push(addressInfo);
                }

                if (rendererData.addressData.length > 0) {
                    updateBalance(counter);
                    updateBinarBalance(counter);
                } else {
                    clbSuccess(rendererData);
                }
            }
        });

        function updateBalance(index) {
            web3Local.eth.getBalance(rendererData.addressData[index].address, function (error, balance) {
                rendererData.addressData[index].balance = parseFloat(web3Local.utils.fromWei(balance, 'ether')).toFixed(2);
                rendererData.sumBalance = rendererData.sumBalance + parseFloat(web3Local.utils.fromWei(balance, 'ether'));
                updateBinarBalance(counter);
                updateSzarBalance(counter);

                if (counter < rendererData.addressData.length - 1) {
                    counter++;
                    updateBalance(counter);
                } else {
                    rendererData.sumBalance = parseFloat(rendererData.sumBalance).toFixed(2);
                    clbSuccess(rendererData);
                }
            });
        }

        function updateBinarBalance(index) {
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
            var contract = new web3Local.eth.Contract(abi, "0x5157adC7156984520F2Aeb94247E6268f3091b6B");
            var binarHolder = rendererData.addressData[index].address;
            contract.methods.balanceOf(binarHolder).call().then(function (binarBalance) {
                rendererData.addressData[index].binarBalance = binarBalance;
            });
        }

        function updateSzarBalance(index) {
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
            var contract = new web3Local.eth.Contract(abi, "0x52CD8E72B438E362F0235080DD63EDb61B740656");
            var szarHolder = rendererData.addressData[index].address;
            contract.methods.balanceOf(szarHolder).call().then(function (szarBalance) {
                rendererData.addressData[index].szarBalance = szarBalance;
            });
        }
    }

    getAddressListData(clbError, clbSuccess) {
        var rendererData = {};
        rendererData.addressData = [];

        var wallets = TSFDatatabse.getWallets();
        var counter = 0;

        web3Local.eth.getAccounts(function (err, res) {
            if (err) {
                clbError(err);
            } else {
                for (var i = 0; i < res.length; i++) {
                    var walletName = vsprintf("Account %d", [i + 1]);
                    if (wallets) {
                        walletName = wallets.names[res[i]] || walletName;
                    }

                    var addressInfo = {};
                    addressInfo.address = res[i];
                    addressInfo.name = walletName;
                    rendererData.addressData.push(addressInfo);
                }

                clbSuccess(rendererData);
            }
        });
    }

    createNewAccount(password, clbError, clbSuccess) {
        web3Local.eth.personal.newAccount(password, function (error, account) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(account);
            }
        });
    }

    importFromPrivateKey(privateKey, keyPassword, clbError, clbSuccess) {
        web3Local.eth.personal.importRawKey(privateKey, keyPassword, function (error, account) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(account);
            }
        });
    }

    subsribePendingTransactions(clbError, clbSuccess, clbData) {
        this.txSubscribe = web3Local.eth.subscribe('pendingTransactions', function (error, result) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(result);
            }
        }).on("data", function (transaction) {
            if (clbData) {
                clbData(transaction);
            }
        });
    }

    unsubsribePendingTransactions(clbError, clbSuccess) {
        if (this.txSubscribe) {
            this.txSubscribe.unsubscribe(function (error, success) {
                if (error) {
                    clbError(error);
                } else {
                    clbSuccess(success);
                }
            });
        }
    }

    subsribeNewBlockHeaders(clbError, clbSuccess, clbData) {
        this.bhSubscribe = web3Local.eth.subscribe('newBlockHeaders', function (error, result) {
            if (error) {
                clbError(error);
            } else {
                clbSuccess(result);
            }
        }).on("data", function (blockHeader) {
            if (clbData) {
                clbData(blockHeader);
            }
        });
    }

    unsubsribeNewBlockHeaders(clbError, clbSuccess) {
        if (this.bhSubscribe) {
            this.bhSubscribe.unsubscribe(function (error, success) {
                if (error) {
                    clbError(error);
                } else {
                    clbSuccess(success);
                }
            });
        }
    }

    closeConnection() {
        web3Local.currentProvider.connection.close();
    }
}

// create new blockchain variable
TSFBlockchain = new Blockchain();
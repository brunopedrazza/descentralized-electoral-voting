// import detectEthereumProvider from '@metamask/detect-provider';
onload = function () {
    var eth = new Eth(TestRPC.provider());
    var el = function (id) { return document.getElementById(id); };


    // uncomment to enable MetaMask support:
    if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
        eth.setProvider(window.web3.currentProvider);
    } else {
        eth.setProvider(provider); // set to TestRPC if not available
    }


    eth.accounts(function (accountsError, accounts) {
        el('accountAddress').innerHTML = accounts[0].substr(0, 15);

        // get the current account balance
        eth.getBalance(accounts[0]).then(function (balance) {
            el('accountBalance').innerHTML = Eth.fromWei(balance, 'ether');
        });
    }
    // var ethereumButton = document.getElementById('enableEthereumButton');
    // var showAccount = document.getElementById('showAccount');

    // var accountSelected = '';

    // ethereumButton.addEventListener('click', () => {
    //     getAccount();
    // });

    // async function getAccount() {
    //     const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    //     accountSelected = accounts[0];
    //     showAccount.innerHTML = accountSelected;
    // }

    // ethereum.on('accountsChanged', function (accounts) {
    //     accountSelected = accounts[0];
    //     showAccount.innerHTML = accountSelected;
    //     // Time to reload your interface with accounts[0]!
    // });
}

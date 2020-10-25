// import detectEthereumProvider from '@metamask/detect-provider';
onload = function () {
    var ethereumButton = document.getElementById('enableEthereumButton');
    var showAccount = document.getElementById('showAccount');

    var selectedButton = document.getElementById('selectedButton');
    var selectedAccount = document.getElementById('showSelectedAccount');

    var accountSelected = '';

    ethereumButton.addEventListener('click', () => {
        getAccount();
    });

    selectedButton.addEventListener('click', () => {
        selectedAccount.innerHTML = accountSelected;
    });

    async function getAccount() {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        accountSelected = accounts[0];
        showAccount.innerHTML = account;
    }

    ethereum.on('accountsChanged', function (accounts) {
        accountSelected = accounts[0];
        showAccount.innerHTML = account;
        // Time to reload your interface with accounts[0]!
    });
}

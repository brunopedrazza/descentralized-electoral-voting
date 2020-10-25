// import detectEthereumProvider from '@metamask/detect-provider';

const ethereumButton = document.getElementById('enableEthereumButton');
const showAccount = document.getElementById('showAccount');

ethereumButton.addEventListener('click', () => {
  getAccount();
});

async function getAccount() {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const account = accounts[0];
  showAccount.innerHTML = account;
}

ethereum.on('accountsChanged', function (accounts) {
    const account = accounts[0];
    showAccount.innerHTML = account;
    // Time to reload your interface with accounts[0]!
});

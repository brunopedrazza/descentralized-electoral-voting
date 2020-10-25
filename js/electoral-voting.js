const ethEnabled = () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
        return true;
    }
    return false;
}

if (!ethEnabled()) {
    alert("Metamask or browser with Ethereum not detected!");
} else {
    alert("Connected!");
    var account = '';
    var accountInterval = setInterval(function () {
        if (web3.eth.accounts[0] !== account) {
            // MetaMask account is changed
            account = web3.eth.accounts[0];
        }
    }, 300);
}

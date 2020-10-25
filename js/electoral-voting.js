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
    window.ethereum.on('accountsChanged', function (accounts) {
        console.log(accounts[0]);
    });
}


onload = function () {
    var ethereumButton = document.getElementById('enableEthereumButton');
    var accountAddress = document.getElementById('accountAddress');

    var electoralVotingABI = electoralVotingMetadata.output.abi
    var electoralVotingByteCode = electoralVotingDeploy.data.bytecode.object

    var accountSelected = '';

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
    }
    else {
        window.ElectoralVoting = new web3.eth.Contract(electoralVotingABI);
        saveCoinbase();
    }

    ethereumButton.addEventListener('click', () => {
        getAccount();
    });

    async function getAccount() {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        accountSelected = accounts[0];

        window.ElectoralVoting.deploy({
            data: electoralVotingByteCode,
            arguments: ['Presidencia', 'Brasil', '2020', 99999999999, 9999999999999]
        })
            .send({
                from: accountSelected,
                gas: 1500000,
                gasPrice: '30000000000000'
            }, function (error, transactionHash) { })
            .on('error', function (error) { console.log(error) })
            .on('transactionHash', function (transactionHash) { console.log(transactionHash) })
            .on('receipt', function (receipt) {
                console.log(receipt.contractAddress) // contains the new contract address
            })
            .on('confirmation', function (confirmationNumber, receipt) { console.log(confirmationNumber) })
            .then(function (newContractInstance) {
                console.log(newContractInstance.options.address) // instance with the new contract address
            });

        accountAddress.innerHTML = accountSelected;
    }

    ethereum.on('accountsChanged', function (accounts) {
        accountSelected = accounts[0];
        accountAddress.innerHTML = accountSelected;
        // Time to reload your interface with accounts[0]!
    });
}


onload = function () {
    var ethereumButton = document.getElementById('enableEthereumButton');
    var accountAddress = document.getElementById('accountAddress');

    var electoralVotingABI = electoralVotingMetadata.output.abi
    var electoralVotingByteCode = electoralVotingDeploy.data.bytecode.object
    console.log(electoralVotingABI);
    console.log(electoralVotingByteCode);

    var accountSelected = '';

    ethereumButton.addEventListener('click', () => {
        getAccount();
    });

    async function getAccount() {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        accountSelected = accounts[0];
        accountAddress.innerHTML = accountSelected;
    }

    ethereum.on('accountsChanged', function (accounts) {
        accountSelected = accounts[0];
        accountAddress.innerHTML = accountSelected;
        // Time to reload your interface with accounts[0]!
    });
}

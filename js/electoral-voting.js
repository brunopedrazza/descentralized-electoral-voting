const contractABI = electoralVotingMetadata.output.abi;
const contractByteCode = electoralVotingDeploy.data.bytecode.object;

var contractToBeDeployed;

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
    contractToBeDeployed = new web3.eth.Contract(contractABI);
    var accountInterval = setInterval(function () {
        web3.eth.getAccounts()
            .then(accounts => window.account = accounts[0]);
    }, 1000);
}

async function deployContract() {
    var args = ['Presidencia', 'Brasil', '2020', 1603648800, 1603648800];
    contractToBeDeployed.deploy({
        data: contractByteCode,
        arguments: args
    }).send({
        from: window.account,
        gas: 3000000,
        gasPrice: '1000000000'
    }, function (error, transactionHash) { })
        .on('error', function (error) { console.log(error); })
        .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
        .on('confirmation', function (confirmationNumber, receipt) { console.log(confirmationNumber); })
        .then(function (newContractInstance) {
            window.ElectoralVoting = newContractInstance;
        });
}
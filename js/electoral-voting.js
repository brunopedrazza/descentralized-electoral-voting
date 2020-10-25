const contractABI = electoralVotingMetadata.output.abi;
const contractByteCode = electoralVotingDeploy.data.bytecode.object;

var contractToBeDeployed;
var electoralVotingContract;
var account;

const ethEnabled = () => {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
        return true;
    }
    return false;
}

async function saveCoinbase() {
    window.coinbase = await window.web3.eth.getCoinbase();
};

if (!ethEnabled()) {
    alert("Metamask or browser with Ethereum not detected!");
}
else {
    contractToBeDeployed = new web3.eth.Contract(contractABI);
    var account = web3.eth.accounts[0];
    var accountInterval = setInterval(function () {
        if (web3.eth.accounts[0] !== account) {
            account = web3.eth.accounts[0];
        }
    }, 500);
    saveCoinbase();
}

async function deployContract() {
    var args = ['Presidencia', 'Brasil', '2020', 1603645200, 1603648800];
    contractToBeDeployed.deploy({
        data: contractByteCode,
        arguments: args
    }).send({
        from: "0x0eec886B9b61aEdd64D1A308CC08a69Ee9f6DBA3",
        gas: 3000000,
        gasPrice: '1000000000'
    }, function (error, transactionHash) { })
        .on('error', function (error) { console.log(error); })
        .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
        .on('confirmation', function (confirmationNumber, receipt) { console.log(confirmationNumber); })
        .then(function (newContractInstance) {
            electoralVotingContract = newContractInstance;
        });
}
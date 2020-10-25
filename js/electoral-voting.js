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

async function deployContract(politicalOffice, country, year, startTime, endTime) {
    var args = [politicalOffice, country, year, startTime, endTime];
    contractToBeDeployed.deploy({
        data: contractByteCode,
        arguments: args
    }).send({
        from: window.account,
        gas: 3000000,
        gasPrice: '1000000000'
    }, function () { })
        .on('error', function (error) { console.log(error); })
        .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
        .then(function (newContractInstance) {
            window.ElectoralVoting = newContractInstance;
        });
}

async function addCandidate(name, politicalParty, number) {
    var args = [name, politicalParty, number];
    console.log(window.ElectoralVoting);
}


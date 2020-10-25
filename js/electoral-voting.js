const contractABI = electoralVotingMetadata.output.abi;
const contractByteCode = electoralVotingDeploy.data.bytecode.object;

var contractToBeDeployed;

const ethEnabled = () => {
    if (window.ethereum) {
        window.web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
        window.web3.handleRevert = true;
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
        web3.eth.getAccounts().then(accounts => window.account = accounts[0]);
    }, 1000);
}

async function deployContract(politicalOffice, country, year, startTime, endTime) {
    var args = [politicalOffice, country, year, startTime, endTime];
    contractToBeDeployed.deploy({ data: contractByteCode, arguments: args })
        .send({ from: window.account, gas: 3000000, gasPrice: '1000000000' })
        .on('error', function (error) { console.log(error); })
        .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
        .then(function (newContractInstance) {
            console.log('Contract deployed with success!');
            console.log('Contract address: ' + newContractInstance._address)
            window.ElectoralVoting = newContractInstance;
        });
}

async function addCandidate(name, politicalParty, number) {
    var thash = '';
    window.ElectoralVoting.methods.addCandidate(name, politicalParty, number).send({ from: window.account })
        .on('receipt', function (receipt) {
            console.log(receipt);
            web3.eth.getTransaction(receipt.transactionHash)
                .then(console.log);
        })
        .on('transactionHash', function (transactionHash) { thash = transactionHash })
        .on('error', function (error) {
            web3.eth.getTransaction(thash)
                .then(console.log);
        });
}

async function getCandidate(number) {
    window.ElectoralVoting.methods.getCandidate(number).call({ from: window.account })
        .then(function (result) {
            console.log(result);
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function getVotesCount(number) {
    window.ElectoralVoting.methods.getCandidateVotesCount(number).call({ from: window.account })
        .then(function (result) {
            console.log(result);
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function vote(number) {
    window.ElectoralVoting.methods.vote(number).send({ from: window.account })
        .on('receipt', function (receipt) { console.log(receipt); })
        .on('error', function (error) { console.log(error); });
}

async function getElectionWinner() {
    window.ElectoralVoting.methods.getElectionWinner().call({ from: window.account })
        .then(function (result) {
            console.log(result);
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function getMyVote() {
    window.ElectoralVoting.methods.getMyVote().call({ from: window.account })
        .then(function (result) {
            console.log(result);
        })
        .catch(function (error) {
            console.log(error);
        });
}

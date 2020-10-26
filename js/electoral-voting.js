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

function callDeployContract() {
    changeTitle("Deploying the contract...");
    var politicalOffice = document.getElementById("political-office").value;
    var country = document.getElementById("country").value;
    var electionYear = document.getElementById("election-year").value;
    var startTime = Date.parse(document.getElementById("start-time").value);
    var endTime = Date.parse(document.getElementById("end-time").value);

    deployContract(politicalOffice, country, electionYear, secondsSinceEpoch(startTime), secondsSinceEpoch(endTime));
}

async function deployContract(politicalOffice, country, year, startTime, endTime) {
    var args = [politicalOffice, country, year, startTime, endTime];
    console.log("Deploying contract with these arguments:");
    console.log(args);
    contractToBeDeployed.deploy({ data: contractByteCode, arguments: args })
        .send({ from: window.account })
        .on('error', function (error) {
            handleError('deployContract');
            console.log(error); 
        })
        .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
        .then(function (newContractInstance) {
            console.log('Contract deployed with success!');
            console.log('Contract address: ' + newContractInstance._address)
            window.ElectoralVoting = newContractInstance;
            getElectionInformations();
        });
}

function useExistingContract() {
    var existingContractAddress = document.getElementById("contract-address").value;
    window.ElectoralVoting = new web3.eth.Contract(contractABI, existingContractAddress);
    console.log('Existing ElectoralVoting contract has loaded.');
    getElectionInformations();
}

async function addCandidate(name, politicalParty, number) {
    window.ElectoralVoting.methods.addCandidate(name, politicalParty, number).send({ from: window.account })
        .on('receipt', function (receipt) {
            console.log('Candidate added with success.');
            console.log(receipt); 
        })
        .on('error', function (error) { 
            handleError('addCandidate');
            console.log(error); 
        });
}

async function getElectionInformations() {
    window.ElectoralVoting.methods.getElectionInformations().call({ from: window.account })
        .then(function (result) {
            console.log('Election informations was found with success.');
            var result =  {
                "responsible": result.responsible_,
                "politicalOffice": result.politicalOffice_,
                "country": result.year_,
                "startTime": epochToDate(result.startTime_),
                "endTime": epochToDate(result.endTime_),
            };
            console.log(result);
            showInformations(result);
        })
        .catch(function (error) {
            handleError('getElectionInformations');
            console.log(error); 
        });
}

async function getCandidate(number) {
    window.ElectoralVoting.methods.getCandidate(number).call({ from: window.account })
        .then(function (result) {
            console.log('Candidate found with success.');
            console.log(result);
        })
        .catch(function (error) {
            handleError('getCandidate');
            console.log(error); 
        });
}

async function getVotesCount(number) {
    window.ElectoralVoting.methods.getCandidateVotesCount(number).call({ from: window.account })
        .then(function (result) {
            console.log('Number of votes for this candidate:');
            console.log(result); 
        })
        .catch(function (error) {
            handleError('getVotesCount');
            console.log(error); 
        });
}

async function vote(number) {
    window.ElectoralVoting.methods.vote(number).send({ from: window.account })
        .on('receipt', function (receipt) {
            console.log('Your vote was computed with success.');
            console.log(receipt); 
        })
        .on('error', function (error) {
            handleError('vote');
            console.log(error); 
        });
}

async function getElectionWinner() {
    window.ElectoralVoting.methods.getElectionWinner().call({ from: window.account })
        .then(function (result) {
            console.log('The winner was computed with success.');
            console.log(result); 
        })
        .catch(function (error) { 
            handleError('getElectionWinner');
            console.log(error); 
        });
}

async function getMyVote() {
    window.ElectoralVoting.methods.getMyVote().call({ from: window.account })
        .then(function (result) {
            console.log('Your vote was returned with success.'); 
            console.log(result); 
        })
        .catch(function (error) {
            handleError('getMyVote'); 
            console.log(error); 
        });
}

function handleError(from){
    console.log('There was an error: ' + from);
}

function showInformations(info) {
    killFirstStep();
    changeTitle(info.politicalOffice + "election in " + info.country + " " + info.year);

    createSpanElement('Responsible address: ' + info.responsible);
    createSpanElement('Political office: ' + info.politicalOffice);
    createSpanElement('Country: ' + info.country);
    createSpanElement('Year: ' + info.year);
    createSpanElement('Start time: ' + info.startTime);
    createSpanElement('End time: ' + info.endTime);
}

function killFirstStep() {
    var firstStep = document.getElementById("first-step");
    firstStep.remove();
}

function createSpanElement(text) {
    var information = document.getElementById("information");
    var spanElement = document.createElement("SPAN");
    var textElement = document.createTextNode(text);
    spanElement.appendChild(textElement);
    information.appendChild(spanElement);
}

function changeTitle(text) {
    var title = document.getElementById("title");
    title.innerHTML = "Deploying the contract...";
} 

function secondsSinceEpoch(date) {  
    return Math.floor( date / 1000 );  
}

function epochToDate(seconds) {
    var d = new Date(0);
    return d.setUTCSeconds(seconds);
}

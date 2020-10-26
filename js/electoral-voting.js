const contractABI = electoralVotingMetadata.output.abi;
const contractByteCode = electoralVotingDeploy.data.bytecode.object;

var contractToBeDeployed;

const ethEnabled = () => {
    if (window.ethereum) {
        window.web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
        window.web3.eth.handleRevert = true;
        return true;
    }
    return false;
}

if (!ethEnabled()) {
    const message = "Metamask or browser with Ethereum not detected!";
    alert(message);
    changeTitle(message);
    hideFirstStep();
}

else {
    contractToBeDeployed = new window.web3.eth.Contract(contractABI);
    window.web3.eth.getAccounts().then(function (accounts) {
        window.web3.eth.defaultAccount = accounts[0];
        changeCurrentAddress(accounts[0]);
        console.log("Current account: " + accounts[0]);
    });
    window.ethereum.on('accountsChanged', function (accounts) {
        window.web3.eth.defaultAccount = accounts[0];
        console.log("Account changed to address: " + accounts[0]);
        changeCurrentAddress(accounts[0]);
        if (window.responsible) {
            const isResponsible = window.web3.eth.defaultAccount == window.responsible;
            if (isResponsible) createAddCandidate();
            else hideAddCandidate();
            changeResponsibleMessage();
        }
    })
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
    contractToBeDeployed.options.address = window.web3.eth.defaultAccount;
    contractToBeDeployed.defaultAccount = window.web3.eth.defaultAccount;
    console.log("Deploying contract with these arguments:");
    console.log(args);
    try {
        contractToBeDeployed.deploy({ data: contractByteCode, arguments: args })
            .send({ from: window.web3.eth.defaultAccount })
            .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
            .on('error', function () {
                logError('deployContract');
                showErrorReason('Unknown error while trying to deploy the contract.');
            })
            .then(function (newContractInstance) {
                console.log('Contract deployed with success!');
                console.log('Contract address: ' + newContractInstance._address)
                window.ElectoralVoting = newContractInstance;
                getElectionInformations();
            });
    }
    catch {
        logError('deployContract');
        showErrorReason('Invalid inputs to deploy the contract.');
    }
}

function useExistingContract() {
    var existingContractAddress = document.getElementById("contract-address").value;
    try {
        window.ElectoralVoting = new window.web3.eth.Contract(contractABI, existingContractAddress);
        console.log('Existing ElectoralVoting contract has loaded.');
        getElectionInformations();
    }
    catch {
        showErrorReason('A contract with this address was not found.');
    }
}

async function addCandidate(name, politicalParty, number) {
    try {
        window.ElectoralVoting.methods.addCandidate(name, politicalParty, number)
            .send({ from: window.web3.eth.defaultAccount })
            .on('receipt', function (receipt) {
                console.log('Candidate added with success.');
                console.log(receipt);
            })
            .catch(function (error) {
                logError(error.reason);
                showErrorReason(error.reason);
            });
    }
    catch {
        logError('addCandidate');
        showErrorReason('Invalid inputs to add a candidate.');
    }
}

async function getElectionInformations() {
    window.ElectoralVoting.methods.getElectionInformations().call()
        .then(function (result) {
            console.log('Election informations was found with success.');
            var result = {
                "responsible": result.responsible_,
                "politicalOffice": result.politicalOffice_,
                "country": result.country_,
                "year": result.year_,
                "startTime": epochToDate(result.startTime_),
                "endTime": epochToDate(result.endTime_),
            };
            console.log(result);
            window.responsible = result.responsible;
            showInformations(result);
            changeResponsibleMessage();
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

async function getCandidate(number) {
    window.ElectoralVoting.methods.getCandidate(number).call()
        .then(function (result) {
            console.log('Candidate found with success.');
            console.log(result);
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

async function getVotesCount(number) {
    window.ElectoralVoting.methods.getCandidateVotesCount(number).call()
        .then(function (result) {
            console.log('Number of votes for this candidate:');
            console.log(result);
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

async function vote(number) {
    window.ElectoralVoting.methods.vote(number)
        .send({ from: window.web3.eth.defaultAccount })
        .on('receipt', function (receipt) {
            console.log('Your vote was computed with success.');
            console.log(receipt);
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

async function getElectionWinner() {
    window.ElectoralVoting.methods.getElectionWinner().call()
        .then(function (result) {
            console.log('The winner was computed with success.');
            console.log(result);
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

async function getMyVote() {
    window.ElectoralVoting.methods.getMyVote().call()
        .then(function (result) {
            console.log('Your vote was returned with success.');
            console.log(result);
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

function logError(message) {
    console.log('There was an error: ' + message);
}

function showErrorReason(reason) {
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = reason;
    setTimeout(hideErrorReason, 7000);
}

function hideErrorReason() {
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = "";
}

function showInformations(info) {
    hideFirstStep();
    changeTitle(info.politicalOffice + " election in " + info.country + " " + info.year);

    createSpanElement('Responsible address: ' + info.responsible);
    createSpanElement('Political office: ' + info.politicalOffice);
    createSpanElement('Country: ' + info.country);
    createSpanElement('Year: ' + info.year);
    createSpanElement('Start time: ' + info.startTime);
    createSpanElement('End time: ' + info.endTime);
}

function hideFirstStep() {
    var firstStep = document.getElementById("first-step");
    firstStep.style.display = "none";
}

function hideAddCandidate() {
    var addCandidate = document.getElementById("add-candidate");
    if (addCandidate) {
        addCandidate.remove();
    }
}

function createAddCandidate() {
    var addCandidate = document.getElementById("add-candidate");
    if (addCandidate) return;
    var firstStep = document.getElementById("first-step");
    if (firstStep) return;

    var secondStep = document.getElementById("second-step");
    var addCandidate = document.createElement("DIV");
    addCandidate.setAttribute("id", "add-candidate");

    var more = document.createElement("BUTTON");
    more.innerHTML = "Add more";
    more.addEventListener("click", createCandidateInput);

    addCandidate.appendChild(more);

    var brElement = document.createElement("BR");
    addCandidate.appendChild(brElement);

    secondStep.appendChild(addCandidate);

    createCandidateInput();

}

function createCandidateInput() {
    var addCandidate = document.getElementById("add-candidate");

    var inputName = document.createElement("input");
    inputName.type = "text";
    addCandidate.appendChild(inputName);

    var inputPoliticalParty = document.createElement("input");
    inputPoliticalParty.type = "text";
    addCandidate.appendChild(inputPoliticalParty);

    var inputNumber = document.createElement("input");
    inputNumber.type = "number";
    addCandidate.appendChild(inputNumber);

    var brElement = document.createElement("BR");
    addCandidate.appendChild(brElement);
}

function createSpanElement(text) {
    var brElement = document.createElement("BR");
    var information = document.getElementById("information");
    var spanElement = document.createElement("SPAN");
    var textElement = document.createTextNode(text);
    spanElement.appendChild(textElement);
    information.appendChild(spanElement);
    information.appendChild(brElement);
}

function changeTitle(text) {
    var title = document.getElementById("title");
    title.innerHTML = text;
}

function changeCurrentAddress(address) {
    var currentAddress = document.getElementById("current-address");
    currentAddress.innerHTML = "Current address is: " + address;
}

function changeResponsibleMessage() {
    const isResponsible = window.web3.eth.defaultAccount == window.responsible;
    var responsibleMessage = document.getElementById("responsible-message");
    if (isResponsible) {
        responsibleMessage.innerHTML = "You are the responsible for this Election.";
    }
    else {
        responsibleMessage.innerHTML = "";
    }
}

function secondsSinceEpoch(date) {
    return Math.floor(date / 1000);
}

function epochToDate(seconds) {
    var date = new Date(seconds * 1000);
    return date;
}

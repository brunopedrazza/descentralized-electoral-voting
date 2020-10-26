const contractABI = electoralVotingMetadata.output.abi;
const contractByteCode = electoralVotingDeploy.data.bytecode.object;

var contractToBeDeployed;

hideSecondStep();

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
            window.isResponsible = window.web3.eth.defaultAccount == window.responsible;
            showOrNotAddCandidate();
            changeResponsibleMessage();
        }
    })
}

function callDeployContract() {
    showLoadingMessage("Deploying the contract...");

    var politicalOffice = document.getElementById("political-office").value;
    var country = document.getElementById("country").value;
    var electionYear = document.getElementById("election-year").value;
    var startTime = Date.parse(document.getElementById("start-time").value);
    var endTime = Date.parse(document.getElementById("end-time").value);

    contractToBeDeployed.options.address = window.web3.eth.defaultAccount;
    contractToBeDeployed.defaultAccount = window.web3.eth.defaultAccount;

    deployContract(politicalOffice, country, electionYear, secondsSinceEpoch(startTime), secondsSinceEpoch(endTime));
}

async function deployContract(politicalOffice, country, year, startTime, endTime) {
    var args = [politicalOffice, country, year, startTime, endTime];
    console.log("Deploying contract with these arguments:");
    console.log(args);
    try {
        contractToBeDeployed.deploy({ data: contractByteCode, arguments: args })
            .send({ from: window.web3.eth.defaultAccount })
            .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
            .on('error', function () {
                logError('deployContract');
                hideLoadingMessage();
                showErrorReason('Unknown error while trying to deploy the contract.');
            })
            .then(function (newContractInstance) {
                hideLoadingMessage();
                const message = 'Contract deployed with success!';
                console.log(message);
                showSuccessMessage(message);
                console.log('Contract address: ' + newContractInstance._address)
                window.ElectoralVoting = newContractInstance;
                getElectionInformations();
            });
    }
    catch {
        logError('deployContract');
        hideLoadingMessage();
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

function callAddCandidate() {
    showLoadingMessage("Adding candidate...");

    var name = document.getElementById("candidate-name").value;
    var politicalParty = document.getElementById("political-party").value;
    var candidateNumber = document.getElementById("candidate-number").value;

    addCandidate(name, politicalParty, candidateNumber);
}

async function addCandidate(name, politicalParty, number) {
    try {
        window.ElectoralVoting.methods.addCandidate(name, politicalParty, number)
            .send({ from: window.web3.eth.defaultAccount })
            .on('receipt', function (receipt) {
                const message = 'Candidate added with success.';
                hideLoadingMessage();
                console.log(message);
                showSuccessMessage(message);
                console.log(receipt);
            })
            .catch(function (error) {
                hideLoadingMessage();
                logError(error.reason);
                showErrorReason(error.reason);
            });
    }
    catch {
        logError('addCandidate');
        hideLoadingMessage();
        showErrorReason('Invalid inputs to add a candidate.');
    }
}

async function getElectionInformations() {
    window.ElectoralVoting.methods.getElectionInformations()
        .call({ from: window.web3.eth.defaultAccount })
        .then(function (result) {
            console.log('Election informations was found with success.');
            var result = {
                "responsible": result.responsible_,
                "politicalOffice": result.politicalOffice_,
                "country": result.country_,
                "year": result.year_,
                "startTime": epochToDate(result.startTime_),
                "endTime": epochToDate(result.endTime_)
            };
            console.log(result);
            window.votingInformation = result;
            window.responsible = result.responsible;
            window.isResponsible = result.responsible == window.web3.eth.defaultAccount;
            showInformations();
            changeResponsibleMessage();
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

function callGetCandidate() {
    var number = document.getElementById("candidate-number-get").value;
    getCandidate(number);
}

async function getCandidate(number) {
    try {
        window.ElectoralVoting.methods.getCandidate(number)
            .call({ from: window.web3.eth.defaultAccount })
            .then(function (result) {
                const message = 'Candidate found with success.';
                console.log(message);
                showSuccessMessage(message);
                console.log(result);
            })
            .catch(function (error) {
                logError(error.reason);
                showErrorReason(error.reason);
            });
    }
    catch {
        logError('getCandidate');
        showErrorReason('Invalid inputs to get a candidate.');
    }
}

async function getVotesCount(number) {
    try {
        window.ElectoralVoting.methods.getCandidateVotesCount(number)
            .call({ from: window.web3.eth.defaultAccount })
            .then(function (result) {
                console.log('Number of votes for this candidate:');
                console.log(result);
            })
            .catch(function (error) {
                logError(error.reason);
                showErrorReason(error.reason);
            });
    }
    catch {
        logError('getVotesCount');
        showErrorReason('Invalid inputs to get a votes count.');
    }
}

function callVote() {
    var number = document.getElementById("vote-number").value;
    showLoadingMessage("Voting...");
    vote(number);
}

async function vote(number) {
    try {
        window.ElectoralVoting.methods.vote(number)
            .send({ from: window.web3.eth.defaultAccount })
            .on('receipt', function (receipt) {
                const message = 'Your vote was computed with success.';
                console.log(message);
                hideLoadingMessage();
                showSuccessMessage(message);
                console.log(receipt);
            })
            .catch(function (error) {
                logError(error.reason);
                hideLoadingMessage();
                showErrorReason(error.reason);
            });
    }
    catch {
        logError('vote');
        hideLoadingMessage();
        showErrorReason('Invalid inputs to vote for a candidate.');
    }
}

function callGetWinner() {
    var response = getElectionWinner();
    if (response) {
        console.log('call get winner result' + response);
    }
}

async function getElectionWinner() {
    window.ElectoralVoting.methods.getElectionWinner()
        .call({ from: window.web3.eth.defaultAccount })
        .then(function (result) {
            const message = 'The winner was computed with success.';
            console.log(message);
            showSuccessMessage(message);
            result = {
                "name": result.name_,
                "politicalParty": result.politicalParty_,
                "number": result.number_
            };
            console.log(result);
            return result;
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

function callGetMyVote() {
    var response = getMyVote();
    if (response) {
        console.log('call get my vote' + response);
    }
}

async function getMyVote() {
    window.ElectoralVoting.methods.getMyVote()
        .call({ from: window.web3.eth.defaultAccount })
        .then(function (result) {
            const message = 'Your vote was returned with success.';
            console.log(message);
            showSuccessMessage(message);
            result = {
                "name": result.name_,
                "politicalParty": result.politicalParty_,
                "number": result.number_
            };
            console.log(result);
            return result;
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

function logError(message) {
    console.log('There was an error: ' + message);
}

var timeoutError;

function showErrorReason(reason) {
    clearTimeout(timeoutError);
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = reason;
    timeoutError = setTimeout(hideErrorReason, 10000);
}

function hideErrorReason() {
    var errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = "";
}

var timeoutSuccess;

function showSuccessMessage(message) {
    clearTimeout(timeoutSuccess);
    var successMessage = document.getElementById('success-message');
    successMessage.innerHTML = message;
    timeoutSuccess = setTimeout(hideSuccessMessage, 10000);
}

function hideSuccessMessage() {
    var successMessage = document.getElementById('success-message');
    successMessage.innerHTML = "";
}

function showLoadingMessage(message) {
    var loadingMessage = document.getElementById('loading-message');
    loadingMessage.innerHTML = message;
}

function hideLoadingMessage() {
    var loadingMessage = document.getElementById('loading-message');
    loadingMessage.innerHTML = "";
}

function showInformations() {
    var info = window.votingInformation;

    hideFirstStep();
    showSecondStep();

    showOrNotAddCandidate();

    changeTitle(info.politicalOffice + " election in " + info.country + " " + info.year);

    createSpanElement('Responsible address: ' + info.responsible);
    createSpanElement('Political office: ' + info.politicalOffice);
    createSpanElement('Country: ' + info.country);
    createSpanElement('Year: ' + info.year);
    createSpanElement('Start time: ' + info.startTime);
    createSpanElement('End time: ' + info.endTime);
}

function showOrNotAddCandidate() {
    if (window.isResponsible) showAddCandidate();
    else hideAddCandidate();
}

function hideFirstStep() {
    var firstStep = document.getElementById("first-step");
    firstStep.style.display = "none";
}

function hideAddCandidate() {
    var addCandidate = document.getElementById("add-candidate-form");
    addCandidate.style.display = "none";
}

function showSecondStep() {
    var secondStep = document.getElementById("second-step");
    secondStep.style.display = "block";
}

function hideSecondStep() {
    var secondStep = document.getElementById("second-step");
    secondStep.style.display = "none";
}

function showFirstStep() {
    var firstStep = document.getElementById("first-step");
    firstStep.style.display = "block";
}

function showAddCandidate() {
    var addCandidate = document.getElementById("add-candidate-form");
    addCandidate.style.display = "block";
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
    var responsibleMessage = document.getElementById("responsible-message");
    if (window.isResponsible) {
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

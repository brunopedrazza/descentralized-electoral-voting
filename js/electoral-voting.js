const contractABI = electoralVotingMetadata.output.abi;
const contractByteCode = electoralVotingDeploy.data.bytecode.object;

var contractToBeDeployed;
var totalCandidates = 0;

hideSecondStep();

const ethEnabled = () => {
    if (window.ethereum) {
        window.ethereum.autoRefreshOnNetworkChange = false;
        window.web3 = new Web3(window.ethereum);
        window.ethereum.request({ method: 'eth_requestAccounts' });
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
    const localStorageAddress = window.localStorage.getItem("contractAddress");
    if (localStorageAddress) {
        useLocalStorageAddress(localStorageAddress);
    }
    else {
        contractToBeDeployed = new window.web3.eth.Contract(contractABI);
    }

    window.web3.eth.getAccounts().then(function (accounts) {
        if (accounts.length > 0) {
            window.web3.eth.defaultAccount = accounts[0];
            changeCurrentAddress(accounts[0]);
            console.log("Current account: " + accounts[0]);
        }
        else {
            changeCurrentAddress("You don't have any active account");
            console.log("No account available.");
        }
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
        clearAllData();
    });

    window.ethereum.on('chainChanged', (chainId) => {
        window.localStorage.removeItem("contractAddress");
        window.location.reload();
    });
}

function callDeployContract() {
    var politicalOffice = document.getElementById("political-office").value;
    var place = document.getElementById("place").value;
    var electionYear = document.getElementById("election-year").value;
    var startTime = Date.parse(document.getElementById("start-time").value);
    var endTime = Date.parse(document.getElementById("end-time").value);

    contractToBeDeployed.options.address = window.web3.eth.defaultAccount;
    contractToBeDeployed.defaultAccount = window.web3.eth.defaultAccount;

    deployContract(politicalOffice, place, electionYear, secondsSinceEpoch(startTime), secondsSinceEpoch(endTime));
}

async function deployContract(politicalOffice, place, year, startTime, endTime) {
    var args = [politicalOffice, place, year, startTime, endTime];
    showLoadingDeployOrAddButton("deploy-contract", "Deploying contract...");
    console.log("Deploying contract with these arguments:");
    console.log(args);
    try {
        if (!window.web3.eth.defaultAccount)  throw new Error("No account selected");
        contractToBeDeployed.deploy({ data: contractByteCode, arguments: args })
            .send({ from: window.web3.eth.defaultAccount })
            .on('transactionHash', function (transactionHash) { console.log(transactionHash); })
            .on('error', function (error) {
                if (error.code == 4001) error.reason = 'Transaction was rejected by you.';
                else error.reason = 'Unknown error while trying to deploy the contract.';
                hideLoadingDeployOrAddButton("deploy-contract", "Deploying contract...");
                logError('deployContract');
                showErrorReason(error.reason);
            })
            .then(function (newContractInstance) {
                const message = 'Contract deployed with success!';
                console.log(message);
                showSuccessMessage(message);
                console.log('Contract address: ' + newContractInstance._address)
                window.localStorage.setItem("contractAddress", newContractInstance._address);
                window.contractAddress = newContractInstance._address;
                window.ElectoralVoting = newContractInstance;
                hideLoadingDeployOrAddButton("deploy-contract", "Deploy contract");
                getElectionInformations();
            });
    }
    catch (error) {
        var errorMessage = 'Invalid inputs to deploy the contract.';
        if (error.message) {
            errorMessage = error.message;
        }
        logError('deployContract');
        hideLoadingDeployOrAddButton("deploy-contract", "Deploy contract");
        showErrorReason(errorMessage);
    }
}

function useExistingContract() {
    try {
        var existingContractAddress = document.getElementById("contract-address").value;
        window.ElectoralVoting = new window.web3.eth.Contract(contractABI, existingContractAddress);
        console.log('Existing ElectoralVoting contract has loaded.');
        window.localStorage.setItem("contractAddress", existingContractAddress);
        window.contractAddress = existingContractAddress;
        getElectionInformations();
    }
    catch (error) {
        showErrorReason('A contract with this address was not found.');
    }
}

function useLocalStorageAddress(address) {
    try {
        window.ElectoralVoting = new window.web3.eth.Contract(contractABI, address);
        console.log('Local storage ElectoralVoting contract has loaded.');
        window.contractAddress = address;
        getElectionInformations();
    }
    catch {
        showErrorReason('A contract with this address was not found.');
    }
}

function callAddCandidate() {

    var name = document.getElementById("candidate-name").value;
    var politicalParty = document.getElementById("political-party").value;
    var candidateNumber = document.getElementById("candidate-number").value;

    addCandidate(name, politicalParty, parseInt(candidateNumber));
}

async function addCandidate(name, politicalParty, number) {
    try {
        window.ElectoralVoting.methods.addCandidate(name, politicalParty, number)
            .send({ from: window.web3.eth.defaultAccount })
            .on('receipt', function (receipt) {
                const message = 'Candidate added with success.';
                hideLoadingDeployOrAddButton("add-candidate", "Add");
                console.log(message);
                showSuccessMessage(message);
                console.log(receipt);
            })
            .catch(function (error) {
                if (error.code == 4001) error.reason = 'Transaction was rejected by you.';
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
    window.ElectoralVoting.methods.getElectionInformations()
        .call({ from: window.web3.eth.defaultAccount })
        .then(function (result) {
            console.log('Election informations was found with success.');
            var result = {
                "responsible": result.responsible_,
                "politicalOffice": result.politicalOffice_,
                "place": result.place_,
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
            if (error.reason) {
                logError(error.reason);
                showErrorReason(error.reason);
            }
            else {
                var message = "Unable to retrieve contract information."
                logError(message);
                showErrorReason(message);
            }
        });
}

async function getNumberOfCandidates() {
    try {
        window.ElectoralVoting.methods.getNumberOfCandidates()
            .call({ from: window.web3.eth.defaultAccount })
            .then(function (result) {
                var nCandidates = parseInt(result);
                console.log('Number of candidates: ' + (nCandidates - 1));
                if (nCandidates > totalCandidates) {
                    totalCandidates = nCandidates;
                    updateNumberOfCandidates(totalCandidates - 1);
                    cleanCadidatesTable();
                    getCandidates(nCandidates);
                }
            })
            .catch(function (error) {
                logError(error.reason);
                showErrorReason(error.reason);
            });
    }
    catch (error) {
        console.log(error);
    }
}

async function getCandidates(numberOfCandidates) {
    for (let candidateIndex = 1; candidateIndex < numberOfCandidates; candidateIndex++) {
        window.ElectoralVoting.methods.candidates(candidateIndex)
            .call({ from: window.web3.eth.defaultAccount })
            .then(function (result) {
                addCandidateToList(result);
            })
            .catch(function (error) {
                logError(error.reason);
                showErrorReason(error.reason);
            });
    }
}

function callGetCandidate() {
    var number = document.getElementById("candidate-number-get").value;
    getCandidate(parseInt(number));
}

async function getCandidate(number) {
    try {
        window.ElectoralVoting.methods.getCandidate(number)
            .call({ from: window.web3.eth.defaultAccount })
            .then(function (result) {
                result = {
                    "name": result.name_,
                    "politicalParty": result.politicalParty_,
                    "number": number
                };
                const message = 'Candidate found with success.';
                console.log(message);
                showSuccessMessage(message);
                console.log(result);
                showCandidate(result, "searched");
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

function callGetVotesCount() {
    var number = document.getElementById("candidate-votes-count").value;
    getVotesCount(parseInt(number));
}

async function getVotesCount(number) {
    try {
        window.ElectoralVoting.methods.getCandidateVotesCount(number)
            .call({ from: window.web3.eth.defaultAccount })
            .then(function (result) {
                console.log('Number of votes for this candidate:');
                showVotesCount(result);
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
    showLoadingVoteButton();
    vote(parseInt(number));
}

async function vote(number) {
    try {
        window.ElectoralVoting.methods.vote(number)
            .send({ from: window.web3.eth.defaultAccount })
            .on('receipt', function (receipt) {
                const message = 'Your vote was computed with success.';
                alert(message);
                console.log(message);
                hideLoadingVoteButton();
                showSuccessMessage(message);
                console.log(receipt);
            })
            .catch(function (error) {
                if (error.code == 4001) error.reason = 'Transaction was rejected by you.'
                logError(error.reason);
                hideLoadingVoteButton();
                showErrorReason(error.reason);
            });
    }
    catch {
        logError('vote');
        hideLoadingVoteButton();
        showErrorReason('Invalid inputs to vote for a candidate.');
    }
}

function callGetWinner() {
    getElectionWinner();
}

async function getElectionWinner() {
    window.ElectoralVoting.methods.getElectionWinner()
        .call({ from: window.web3.eth.defaultAccount })
        .then(function (result) {
            result = {
                "name": result.name_,
                "politicalParty": result.politicalParty_,
                "number": result.number_
            };
            const message = 'The winner was computed with success.';
            console.log(message);
            showSuccessMessage(message);
            console.log(result);
            showCandidate(result, "winner");
        })
        .catch(function (error) {
            logError(error.reason);
            showErrorReason(error.reason);
        });
}

function callGetMyVote() {
    getMyVote();
}

async function getMyVote() {
    window.ElectoralVoting.methods.getMyVote()
        .call({ from: window.web3.eth.defaultAccount })
        .then(function (result) {
            result = {
                "name": result.name_,
                "politicalParty": result.politicalParty_,
                "number": result.number_
            };
            const message = 'Your vote was returned with success.';
            console.log(message);
            showSuccessMessage(message);
            console.log(result);
            showCandidate(result, "voted");
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
    alert(reason);
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

function showInformations() {
    var info = window.votingInformation;

    getNumberOfCandidates();
    setInterval(getNumberOfCandidates, 10000);

    hideFirstStep();
    showSecondStep();

    showOrNotAddCandidate();

    changeTitle(info.politicalOffice + " election in " + info.place + " " + info.year);
    changeSubtitle("Contract address: " + window.contractAddress);

    fillInfo("responsible-info", info.responsible);
    fillInfo("political-office-info", info.politicalOffice);
    fillInfo("place-info", info.place);
    fillInfo("year-info", info.year);
    fillInfo("start-time-info", info.startTime);
    fillInfo("end-time-info", info.endTime);
}

function fillInfo(id, text) {
    var info = document.getElementById(id);
    info.innerHTML = text;
}

function showCandidate(candidate, from) {
    document.getElementById(from + "-name").innerHTML = candidate.name;
    document.getElementById(from + "-party").innerHTML = candidate.politicalParty;
    document.getElementById(from + "-number").innerHTML = candidate.number;
}

function showVotesCount(voteCount) {
    var voteCountEl = document.getElementById('vote-count');
    voteCountEl.innerHTML = "Candidate was voted " + voteCount + " times";
}

function clearAllData() {

    document.getElementById('vote-count').innerHTML = "Number of votes";

    hideCandidate("winner");
    hideCandidate("searched");
    hideCandidate("voted");
}

function hideCandidate(from) {
    document.getElementById(from + "-name").innerHTML = "Name";
    document.getElementById(from + "-party").innerHTML = "Political party";
    document.getElementById(from + "-number").innerHTML = "Number";
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
    secondStep.style.display = "flex";

    var reloadButton = document.getElementById("reload-button");
    reloadButton.style.removeProperty("display");

    var subtitle = document.getElementById("subtitle");
    subtitle.innerHTML = "";
}

function hideSecondStep() {
    var secondStep = document.getElementById("second-step");
    secondStep.style.display = "none";
}

function showFirstStep() {
    var firstStep = document.getElementById("first-step");
    firstStep.style.display = "flex";
}

function showAddCandidate() {
    var addCandidate = document.getElementById("add-candidate-form");
    addCandidate.style.display = "block";
}

function createSpanElement(text, elementId) {
    var brElement = document.createElement("BR");
    var element = document.getElementById(elementId);
    var spanElement = document.createElement("SPAN");
    var textElement = document.createTextNode(text);
    spanElement.appendChild(textElement);
    element.appendChild(spanElement);
    element.appendChild(brElement);
}

function changeTitle(text) {
    var title = document.getElementById("title");
    title.innerHTML = text;
}

function changeSubtitle(text) {
    var subtitle = document.getElementById("subtitle");
    subtitle.innerHTML = text;
}

function changeCurrentAddress(address) {
    var currentAddress = document.getElementById("current-address");
    currentAddress.innerHTML = "Current address: " + address;
}

function changeResponsibleMessage() {
    var responsibleMessage = document.getElementById("responsible-message");
    if (window.isResponsible) {
        responsibleMessage.innerHTML = "You are the responsible for this election";
    }
    else {
        responsibleMessage.innerHTML = "";
    }
}

function cleanCadidatesTable() {
    var list = document.getElementById("candidates-list");
    while (list.firstChild) {
        list.removeChild(list.lastChild);
    }
}

function addCandidateToList(candidate) {
    var h6 = document.createElement("H6");
    h6.className = "my-0";
    var text = document.createTextNode(candidate.name);
    h6.appendChild(text);

    var small = document.createElement("SMALL");
    small.className = "text-muted";
    var text = document.createTextNode(candidate.politicalParty);
    small.appendChild(text);

    var div = document.createElement("DIV");
    div.appendChild(h6);
    div.appendChild(small);

    var span = document.createElement("SPAN");
    span.className = "text-muted";
    var text = document.createTextNode(candidate.number);
    span.appendChild(text);

    var li = document.createElement("LI");
    li.className = "list-group-item d-flex justify-content-between lh-condensed";

    li.appendChild(div);
    li.appendChild(span);

    var list = document.getElementById("candidates-list");
    list.appendChild(li);
}

function showLoadingDeployOrAddButton(id, loadingText) {
    var button = document.getElementById(id);
    button.disabled = true;
    button.innerHTML = "";
    
    var span = document.createElement("SPAN");
    span.className = "spinner-border spinner-border-sm mr-2";
    span.setAttribute("role", "status");
    span.setAttribute("aria-hidden", true);
    button.appendChild(span);

    var text = document.createTextNode(loadingText);
    button.appendChild(text);
}

function hideLoadingDeployOrAddButton(id, text) {
    var button = document.getElementById(id);
    while (button.firstChild) {
        button.removeChild(button.lastChild);
    }

    button.disabled = false;
    button.innerHTML = text;
}

function showLoadingVoteButton() {
    var voteButton = document.getElementById("vote");
    voteButton.disabled = true;
    voteButton.innerHTML = "";
    
    var span = document.createElement("SPAN");
    span.className = "spinner-grow spinner-grow-sm text-light";
    span.setAttribute("role", "status");
    span.setAttribute("aria-hidden", true);
    voteButton.appendChild(span);
}

function hideLoadingVoteButton() {
    var voteButton = document.getElementById("vote");
    while (voteButton.firstChild) {
        voteButton.removeChild(voteButton.lastChild);
    }

    voteButton.disabled = false;
    voteButton.innerHTML = "VOTE";
}

function updateNumberOfCandidates(n) {
    var nCandidates = document.getElementById("n-candidates");
    nCandidates.innerHTML = n;
}

function deleteLocalAndReload() {
    window.localStorage.removeItem("contractAddress");
    location.reload();
}

function secondsSinceEpoch(date) {
    return Math.floor(date / 1000);
}

function epochToDate(seconds) {
    var date = new Date(seconds * 1000);
    return date;
}

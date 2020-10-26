pragma solidity >=0.4.22 <0.7.0;

/** 
 * @title ElectoralVoting
 * @dev Implements voting process for elections.
 */
contract ElectoralVoting {
   
    struct Candidate {
        string name;
        string politicalParty;
        uint32 number;
    }
    
    struct Voter {
        Candidate candidateVoted;
        bool voted;
    }

    address public responsible;
    
    string public politicalOffice;
    string public country;
    string public electionYear;
    
    uint256 public startTime;
    uint256 public endTime;

    mapping(address => Voter) private voters;
    
    mapping(uint32 => uint32) private voteCount;

    Candidate[] public candidates;
    
    /** 
     * @dev Create a new ElectoralVoting contract.
     * @param _politicalOffice political office to be contested in this election
     * @param _country country of election
     * @param _electionYear year of election
     * @param _startTime the time when the election will start
     * @param _endTime the time when the election will end
     */
    constructor(string memory _politicalOffice, 
                string memory _country, 
                string memory _electionYear, 
                uint256 _startTime, 
                uint256 _endTime) public {
        require(_startTime < _endTime, "The end time cannot be less than the start time.");
        require(now < _startTime, "The current time cannot be greater than the start time.");
        
        responsible = msg.sender;
        politicalOffice = _politicalOffice;
        country = _country;
        electionYear = _electionYear;
        startTime = _startTime;
        endTime = _endTime;

        // Invalid votes
        candidates.push(Candidate({
            name: "Invalid vote",
            politicalParty: "",
            number: 0
        }));

        voteCount[0] = 0;
    }
    
    /** 
     * @dev Add a new election candidate
     * @param _name name of the candidate to be added
     * @param _politicalParty political party of the candidate
     * @param _number number that people will use to vote on this candidate
     */
    function addCandidate(string memory _name, 
                        string memory _politicalParty, 
                        uint32 _number) public {
        require(msg.sender == responsible, "Only government owner can add a candidate.");
        require(now < startTime, "A candidate can't be added after the election start time.");
        
        bool foundSameCandidate = false;
        for (uint i = 0; i < candidates.length; i++) {
            Candidate storage candidate = candidates[i];
            if (candidate.number == _number ||
                keccak256(bytes(candidate.name)) == keccak256(bytes(_name))) {
                foundSameCandidate = true;
                break;
            }
        }
        require(!foundSameCandidate, "The same candidate has already been added.");
        candidates.push(Candidate({
            name: _name,
            politicalParty: _politicalParty,
            number: _number
        }));
        voteCount[_number] = 0;
    }

    /** 
     * @dev Get the election information
     * @return responsible_ address of the responsable for election
     * @return politicalOffice_ political office to be disputed
     * @return country_ country of election
     * @return year_ year of election
     * @return startTime_ time that election begins
     * @return endTime_ time that election ends
     */
    function getElectionInformations() public view returns (address responsible_, string memory politicalOffice_, 
                            string memory country_, string memory year_, uint256 startTime_, uint256 endTime_) {
        responsible_ = responsible;
        politicalOffice_ = politicalOffice;
        country_ = country;
        year_ = electionYear;
        startTime_ = startTime;
        endTime_ = endTime;
    }
    
    /** 
     * @dev Get a candidate information
     * @param _number number of the candidate
     * @return name_ name of the candidate searched
     * @return politicalParty_ political party of the candidate searched
     */
    function getCandidate(uint32 _number) public view returns (string memory name_, string memory politicalParty_) {
        bool found = false;
        Candidate memory candidate;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].number == _number) {
                candidate = candidates[i];
                found = true;
                break;
            }
        }
        require(found, "Candidate especified not found.");
        
        name_ = candidate.name;
        politicalParty_ = candidate.politicalParty;
    }
    
    /** 
     * @dev Get a candidate votes count
     * @param _number number of the candidate
     * @return voteCount_ number of votes of the candidate
     */
    function getCandidateVotesCount(uint32 _number) public view returns (uint32 voteCount_) {
        require(now > endTime, "You should wait for the election to end to see candidate votes count.");
        
        voteCount_ = voteCount[_number];
    }
    
    /** 
     * @dev Give your vote to a candidate
     * @param _number number of the candidate to be voted
     */
    function vote(uint32 _number) public {
        address senderAddress = msg.sender;
        
        require(now < endTime, "The election has ended.");
        require(now >= startTime, "The election has not yet started.");
        
        require(responsible != senderAddress, "The government owner is not able to vote.");
        require(!voters[senderAddress].voted, "You already voted.");
        require(hasCandidate(_number), "Candidate especified not found.");
        
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].number == _number) {
                voters[senderAddress].candidateVoted = candidates[i];
                break;
            }
        }
        
        voters[senderAddress].voted = true;
        
        voteCount[_number]++;
    }
    
    /** 
     * @dev Compute the votes to check the election winner
     * @return name_ name of the winner candidate
     * @return politicalParty_ political party of the winner candidate
     * @return number_ number of the winner candidate
     */
    function getElectionWinner() public view returns (string memory name_, string memory politicalParty_, uint32 number_) {
        require(now > endTime, "The election has not ended yet.");
        
        uint winningVoteCount = 0;
        Candidate memory winningCandidate;
        for (uint i = 0; i < candidates.length; i++) {
            Candidate memory candidate = candidates[i];
            if (voteCount[candidate.number] > winningVoteCount && candidate.number != 0) {
                winningVoteCount = voteCount[candidate.number];
                winningCandidate = candidate;
            }
        }
        
        name_ = winningCandidate.name;
        politicalParty_ = winningCandidate.politicalParty;
        number_ = winningCandidate.number;
    }
    
    /** 
     * @dev Get the candidate information you voted for
     * @return name_ name of the candidate you voted for
     * @return politicalParty_ political party of the candidate you voted for
     * @return number_ number of the candidate you voted for
     */
    function getMyVote() public view returns (string memory name_, string memory politicalParty_, uint32 number_) {
        address senderAddress = msg.sender;
        
        require(responsible != senderAddress, "The government owner is not able to vote.");
        require(now >= startTime, "The election has not yet started.");
        require(voters[senderAddress].voted, "You haven't voted yet.");
        
        Candidate memory candidate = voters[senderAddress].candidateVoted;
        
        name_ = candidate.name;
        politicalParty_ = candidate.politicalParty;
        number_ = candidate.number;
    }
    
    function hasCandidate(uint _number) internal view returns (bool) { 
        for (uint p = 0; p < candidates.length; p++) {
            if (candidates[p].number == _number) {
                return true;
            }
        }
        return false;
    }
}

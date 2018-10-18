pragma solidity ^0.4.22;

contract COSTLicense {

  event Address(string msg, address addr);

  bytes32 public licenseAgreementHash;
  string public attestation;
  address public licenseHolder;
  uint public assessedValue;
  uint public annualTaxRate;
  address public creator;
  address public beneficiary;
  uint public beneficiarySaleBasisPoints;
  uint public beneficiaryTaxBasisPoints;

  mapping(address => uint) public balances;

  uint public lastCollectionTime; // unix timestamp in seconds

  constructor(bytes32 _licenseAgreementHash,
              uint _assessedValue,
              uint _annualTaxRate,
              address _creator,
              address _beneficiary,
              uint _beneficiarySaleBasisPoints,
              uint _beneficiaryTaxBasisPoints,
              string _attestation) public {

    require(_licenseAgreementHash != bytes32(0));
    require(_annualTaxRate > 0);
    require(_assessedValue > 0);
    require(_creator != address(0));
    if(_beneficiary == address(0)) {
      require(_beneficiarySaleBasisPoints == 0);
      require(_beneficiaryTaxBasisPoints == 0);
    }

    licenseAgreementHash = _licenseAgreementHash;
    licenseHolder = _creator;
    creator = _creator;
    beneficiary = _beneficiary;
    beneficiarySaleBasisPoints = _beneficiarySaleBasisPoints;
    beneficiaryTaxBasisPoints = _beneficiaryTaxBasisPoints;
    assessedValue = _assessedValue;
    annualTaxRate = _annualTaxRate;
    attestation = _attestation;
    lastCollectionTime = now;
  }

  // buy the license for the assessed value
  function buy(uint _newAssessment, string _attestation) public payable {
    collectTaxes();
    require(keccak256(_attestation) == keccak256(attestation), "Bad attestation");
    require(_newAssessment > 0, "Zero new assessment");
    require(msg.value == assessedValue, "Sent incorrect value with transaction");

    if(licenseHolder == creator) {
      // split sale with beneficiary
      uint beneficiaryShare = (assessedValue * beneficiarySaleBasisPoints) / 10000;
      uint creatorShare = assessedValue - beneficiaryShare;
      assert(beneficiaryShare + creatorShare == assessedValue);
      balances[beneficiary] += beneficiaryShare;
      balances[licenseHolder] += creatorShare;
    } else {
      balances[licenseHolder] += assessedValue;
    }

    assessedValue = _newAssessment;
    licenseHolder = msg.sender;
  }

  function assessValue(uint newAssessedValue) public {
    collectTaxes();
    require(msg.sender == licenseHolder, "Unauthroized assessment attempt");
    assessedValue = newAssessedValue;
  }

  function collectTaxes() public {
    if (licenseHolder != beneficiary) {
      _doCollectTaxes();
    }
    lastCollectionTime = now;
  }

  // TODO reduce rounding errors as much as possible
  function _doCollectTaxes() internal {
    uint taxPerYear = (assessedValue * annualTaxRate) / 100;
    uint taxPerSecond = taxPerYear / 31536000; // seconds per year
    uint taxableSeconds = now - lastCollectionTime;
    uint taxAmount = taxableSeconds * taxPerSecond;
    // if license holder doesn't have enough in their balance to pay
    if (balances[licenseHolder] < taxAmount) {
      // reclaim the license, allowing the beneficiary to set a sale price
      // in the future this could automatically allow anyone to open a
      // second price auction for the license
      licenseHolder = creator;
    } else {
      // otherwise collect the taxes
      balances[licenseHolder] -= taxAmount;
      uint beneficiaryShare = (taxAmount * beneficiarySaleBasisPoints) / 10000;
      uint creatorShare = taxAmount - beneficiaryShare;
      assert(beneficiaryShare + creatorShare == taxAmount);
      balances[beneficiary] += beneficiaryShare;
      balances[creator] += creatorShare;
    }
  }

  function balanceOf(address _owner) public view returns (uint) {
    return balances[_owner];
  }

  function withdraw(uint amount) public {
    collectTaxes();
    require(amount <= balances[msg.sender], "insufficient funds");
    balances[msg.sender] -= amount;
    msg.sender.transfer(amount);
  }

  function deposit() public payable {
    balances[msg.sender] += msg.value;
  }

  function () public payable {
    balances[msg.sender] += msg.value;
  }
}

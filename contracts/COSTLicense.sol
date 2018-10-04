pragma solidity ^0.4.22;

contract COSTLicense {

  event Address(string message, address addr);

  bytes32 public licenseAgreementHash;
  address public licenseHolder;
  uint public assessedValue;
  uint public annualTaxRate;
  address public beneficiary;

  mapping(address => uint) public balances;

  uint public lastCollectionTime; // unix timestamp in seconds

  constructor(bytes32 _licenseAgreementHash,
              uint _assessedValue,
              uint _annualTaxRate,
              address _beneficiary) public {

    require(_licenseAgreementHash != bytes32(0));
    require(_annualTaxRate > 0);
    require(_assessedValue > 0);
    require(_beneficiary != address(0));

    licenseAgreementHash = _licenseAgreementHash;
    licenseHolder = _beneficiary;
    beneficiary = _beneficiary;
    assessedValue = _assessedValue;
    annualTaxRate = _annualTaxRate;
  }

  // buy the license for the assessed value
  function buy(uint newAssessment, string agreementStatement) public payable {
    collectTaxes();
    require(sha3(agreementStatement) == sha3("By signing this transaction I agree to the contract's licence agreement"));
    require(newAssessment > 0, "Zero new assessment");
    require(msg.value == assessedValue, "Sent incorrect value with transaction");

    licenseHolder.transfer(assessedValue);

    assessedValue = newAssessment;
    licenseHolder = msg.sender;
  }

  function assessValue(uint newAssessedValue) public {
    collectTaxes();
    require(msg.sender == licenseHolder);
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
      licenseHolder = beneficiary;
    } else {
      // otherwise collect the taxes
      balances[licenseHolder] -= taxAmount;
      balances[beneficiary] += taxAmount;
    }
  }

  function withdraw(uint amount) public {
    require(amount <= balances[msg.sender]);
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

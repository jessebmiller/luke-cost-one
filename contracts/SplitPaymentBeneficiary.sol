pragma solidity ^0.4.22;

import 'openzeppelin-solidity/contracts/payment/SplitPayment.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './COSTLicense.sol';

contract SplitPaymentBeneficiary is SplitPayment, Ownable {

  COSTLicense public licenseContract;

  constructor(address[] payees,
              uint256[] shares) SplitPayment(payees, shares) Ownable() public {}

  function setLicenseContract(address _licenseContractAddress) public onlyOwner {
    require(_licenseContractAddress == address(0));
    licenseContract = COSTLicense(_licenseContractAddress);
  }

  function assessValue(uint _newAssessedValue) public onlyOwner {
    licenseContract.assessValue(_newAssessedValue);
  }
}

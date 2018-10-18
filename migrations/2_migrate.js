const COSTLicense = artifacts.require("./COSTLicense.sol")

const agreementHash = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
const initialValue = 1000000000000000000 // 1 ether
const anualTaxRate = 7
const creator = "0x5a15e72deb10a0013cb985f80ba043d050e64f43"
const beneficiary = "0x3cefa4b73d2433b8e056d388d4ca5f07df9363d2"
const beneficiarySalesBasisPoints = 100
const beneficiaryTaxBasisPoints = 2000
const attestation = "I agree"

module.exports = (deployer) => {
  deployer.deploy(
    COSTLicense,
    agreementHash,
    initialValue,
    anualTaxRate,
    creator,
    beneficiary,
    beneficiarySalesBasisPoints,
    beneficiaryTaxBasisPoints,
    attestation
  )
}

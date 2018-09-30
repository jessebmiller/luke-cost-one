const COSTLicense = artifacts.require("./COSTLicense.sol")
const SplitPaymentBeneficiary = artifacts.require("./SplitPaymentBeneficiary.sol")

const agreementHash = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
const initialValue = 1000000000000000000 // 1 ether
const anualTaxRate = 7

const payees = [
  "0x6017c4f1afe3b52b86e7ef3178e409e9a4aa2a8e"
]
const shares = [100]

module.exports = (deployer) => {
  deployer.deploy(SplitPaymentBeneficiary, payees, shares).then(() => {
    deployer.deploy(
      COSTLicense,
      agreementHash,
      initialValue,
      anualTaxRate,
      SplitPaymentBeneficiary.address
    )
  })
}

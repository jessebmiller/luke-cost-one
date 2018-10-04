const { hashPersonalMessage, ecsign } = require('ethereumjs-util')

const COSTLicense = artifacts.require("./COSTLicense.sol")

function splitSig(sig) {
  console.log(sig)
  const s = {
    v: web3.toDecimal('0x' + sig.slice(130, 132)),
    r: sig.slice(0, 66),
    s: sig.slice(66, 130)
  }
  if (s.v != 27 || s.v != 28) {
    s.v += 27
  }
  console.log(s)
  return s
}

function signAgreement(signer, agreement) {
  return splitSig(
    web3.eth.sign(signer, web3.sha3(agreement))
  )
}

contract("COSTLicence", ([alice, bob, carol, vick, ...accounts]) => {
  console.log("Alice", alice)
  console.log("Bob  ", bob)
  console.log("Carol", carol)
  console.log("Vick ", vick)

  const agreement = "Stub agreement"
  const agreementHash = web3.sha3(agreement)
  const assessedValue = web3.toWei("10", "ether")
  const annualTaxRate = 7
  const beneficiary = alice
  let license
  beforeEach(async () => {
    license = await COSTLicense.new(
      agreementHash,
      assessedValue,
      annualTaxRate,
      beneficiary
    )
  })

  it("instantiates correctly", async () => {
    assert.equal(await license.licenseAgreementHash(), agreementHash)
    assert.equal(await license.licenseHolder(), beneficiary)
    assert.equal(await license.assessedValue(), assessedValue)
    assert.equal(await license.annualTaxRate(), annualTaxRate)
    assert.equal(await license.beneficiary(), beneficiary)
  })

  it("Can be bought for the assessed value", async () => {
    const sig = signAgreement(bob, agreement)
    const agreementHash = web3.sha3(
      agreement
//      `\x19Ethereum Signed Message:\n${agreement.length}${agreement}`
    )
    const newAssessedValue = web3.toWei("11", "ether")
    const aliceBeforeSale = await web3.eth.getBalance(alice)
    const bobBeforeSale = await web3.eth.getBalance(bob)
    await license.buy(
      newAssessedValue,
      "By signing this transaction I agree to the contract's licence agreement",
      {value: assessedValue, from: bob})
    assert.equal(await license.licenseHolder(), bob)
    assert.equal(await license.assessedValue(), newAssessedValue)
    assert.equal(
      aliceBeforeSale + assessedValue,
      await web3.eth.getBalance(alice)
    )
  })
})

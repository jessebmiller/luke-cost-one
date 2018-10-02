const COSTLicense = artifacts.require("./COSTLicense.sol")

contract("COSTLicence", ([alice, bob, carol, vick, ...accounts]) => {

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
    const signature = web3.eth.sign(bob, agreement).substr(2) // remove 0x
    const r = '0x' + signature.slice(0, 64)
    const s = '0x' + signature.slice(64, 128)
    const v = '0x' + signature.slice(128, 130)
    const vDec = web3.toDecimal(v)
    const newAssessedValue = web3.toWei("11", "ether")
    const aliceBeforeSale = await web3.eth.getBalance(alice)
    const bobBeforeSale = await web3.eth.getBalance(bob)
    await license.buy(
      newAssessedValue,
      `\x19Ethereum Signed Message:\n${agreement.length}${agreement}`,
      vDec,
      r,
      s,
      {value: assessedValue, from: bob})
    assert.equal(await license.licenseHolder(), bob)
    assert.equal(await license.assessedValue(), newAssessedValue)
    assert.equal(
      aliceBeforeSale + assessedValue,
      await web3.eth.getBalance(alice)
    )
  })
})

const COSTLicense = artifacts.require("./COSTLicense.sol")

async function assertReverts(f, message) {
  let failed
  try {
    await f()
  } catch (e) {
    failed = e
  }
  assert.equal(
    failed,
    `Error: VM Exception while processing transaction: revert ${message}`,
    `unexpected error message: ${failed}`
  )
}

async function snapshot() {
  return new Promise((accept, reject) => {
    web3.currentProvider.sendAsync({method: `evm_snapshot`}, (err, result)=> {
      if (err) {
        reject(err)
      } else {
        accept(result)
      }
    })
  })
}

async function restore(snapshotId) {
  return new Promise((accept, reject) => {
    web3.currentProvider.sendAsync(
      {
        method: `evm_revert`,
        params: snapshotId ? [snapshotId] : []
      },
      (err, result) => {
        if (err) {
          reject(err)
        } else {
          accept(result)
        }
      }
    )
  })
}

async function forceMine() {
  return await web3.currentProvider.sendAsync({method: `evm_mine`}, (err)=> {});
}

contract("COSTLicense", ([alice, bob, carol, vick, ...accounts]) => {
  console.log("Alice", alice)
  console.log("Bob  ", bob)
  console.log("Carol", carol)
  console.log("Vick ", vick)

  const agreement = "Stub agreement"
  const agreementHash = web3.sha3(agreement)
  const assessedValue = web3.toWei("10", "ether")
  const annualTaxRate = 7
  const beneficiary = alice
  const attestation = "I agree"

  let license
  beforeEach(async () => {
    license = await COSTLicense.new(
      agreementHash,
      assessedValue,
      annualTaxRate,
      beneficiary,
      attestation
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
    const newAssessedValue = web3.toWei("11", "ether")
    const aliceBeforeSale = await web3.eth.getBalance(alice)
    const bobBeforeSale = await web3.eth.getBalance(bob)
    await license.buy(
      newAssessedValue,
      attestation,
      {value: assessedValue, from: bob}
    )
    const reportedAssessedValue = await license.assessedValue()
    const aliceAfterSale = await web3.eth.getBalance(alice)
    assert.equal(await license.licenseHolder(), bob)
    assert.equal(
      reportedAssessedValue.toNumber(),
      newAssessedValue,
      "incorrect assessed value"
    )
    assert.equal(
      aliceBeforeSale.plus(assessedValue).toNumber(),
      aliceAfterSale.toNumber(),
      "Incorrect value to previous owner"
    )
  })

  it("Can be reassessed by the license holder", async () => {
    // the beneficiary can reassess while they still hold the license
    const newValue = web3.toWei("9", "ether")
    await license.assessValue(newValue, {from: alice})
    const reportedValue = async () => {
      const v = await license.assessedValue()
      return v.toNumber()
    }
    assert.equal(newValue, await reportedValue())

    // no one else can
    assertReverts(
      async () => {await license.assessValue(100, {from: bob})},
      "Unauthroized assessment attempt"
    )
    assertReverts(
      async () => {await license.assessValue(50000, {from: carol})},
      "Unauthroized assessment attempt"
    )
    assertReverts(
      async () => {await license.assessValue(3000, {from: vick})},
      "Unauthroized assessment attempt"
    )

    // until they buy the license
    const carolValue = web3.toWei("5", "ether")
    await license.buy(carolValue, attestation, {value: newValue, from: carol})
    assert.equal(carolValue, await reportedValue())
    const carolNewValue = web3.toWei("6", "ether")
    await license.assessValue(carolNewValue, {from: carol})
    assert.equal(carolNewValue, await reportedValue())

    // and no one else
    assertReverts(
      async () => {await license.assessValue(100, {from: alice})},
      "Unauthroized assessment attempt"
    )
    assertReverts(
      async () => {await license.assessValue(50000, {from: bob})},
      "Unauthroized assessment attempt"
    )
    assertReverts(
      async () => {await license.assessValue(3000, {from: vick})},
      "Unauthroized assessment attempt"
    )
  })

  it("accepts deposits and withdrawls", async () => {
    const balanceOf = async (owner) => {
      const b = await license.balanceOf(owner)
      return b.toNumber()
    }
    assert.equal(await balanceOf(bob), 0)
    await license.deposit({value: web3.toWei("2", "ether"), from: bob})
    assert.equal(await balanceOf(bob), web3.toWei("2", "ether"))
    await license.withdraw(web3.toWei("1", "ether"), {from: bob})
    assert.equal(await balanceOf(bob), web3.toWei("1", "ether"))
    await license.withdraw(web3.toWei("1", "ether"), {from: bob})
    assert.equal(await balanceOf(bob), 0)
    assertReverts(
      async () => {await license.withdraw(1000, {from: bob})},
      "insufficient funds"
    )
  })

  it("Taxes the license holder", async () => {
    const bobAssessment = web3.toWei("10", "ether")
    await license.buy(
      bobAssessment,
      attestation,
      {value: web3.toWei("10", "ether"), from: bob}
    )
    const bobDeposit = web3.toWei("1", "ether")
    await license.deposit({value: bobDeposit, from: bob})
    const waitOneYear = () => {
      return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [31536000],
          id: 0
        }, async (err, result) => {
          if (err) { reject(err) }
          else { resolve(result) }
        })
      })
    }
    await waitOneYear()
    await license.collectTaxes()
    const bobAfterTaxBalance = await license.balanceOf(bob)
    const aliceAfterTaxBalance = await license.balanceOf(alice)
    assert.equal(
      bobAfterTaxBalance.toNumber(),
      300000000020032000, // close enough to 7% anual tax...
      "incorrect deposit remaining"
    )
    assert.equal(
      bobAfterTaxBalance.plus(aliceAfterTaxBalance).toNumber(),
      bobDeposit,
      "incorrect alice balance"
    )
  })
})

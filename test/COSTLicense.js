const COSTLicense = artifacts.require("./COSTLicense.sol")

async function assertReverts(f, expectedMessage, notification) {
  let failed
  try {
    await f()
  } catch (e) {
    failed = e
  }
  assert.equal(
    failed,
    `Error: VM Exception while processing transaction: revert ${expectedMessage}`,
    notification
  )
}

async function snapshot() {
  return new Promise((accept, reject) => {
    web3.currentProvider.sendAsync(
      {method: `evm_snapshot`},
      (err, { result })=> {
        if (err) {
          console.log("snapshot error", err)
          reject(err)
        } else {
          accept(result)
        }
      }
    )
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
          console.log("restore error", err)
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
  const annualTaxRate = 10
  const creator = alice
  const beneficiary = carol
  const beneficiarySaleBasisPoints = 100
  const beneficiaryTaxBasisPoints = 2000
  const attestation = "I agree"

  let license
  let snapId
  beforeEach(async () => {
    snapId = await snapshot()
    await forceMine()
    license = await COSTLicense.new(
      agreementHash,
      assessedValue,
      annualTaxRate,
      creator,
      beneficiary,
      beneficiarySaleBasisPoints,
      beneficiaryTaxBasisPoints,
      attestation
    )
  })

  afterEach(async () => {
    await restore(snapId)
    await forceMine()
  })

  it("instantiates correctly", async () => {
    assert.equal(await license.licenseAgreementHash(), agreementHash)
    assert.equal(await license.licenseHolder(), creator)
    assert.equal(await license.creator(), creator)
    assert.equal(await license.beneficiary(), beneficiary)
    assert.equal(await license.assessedValue(), assessedValue)
    assert.equal(await license.annualTaxRate(), annualTaxRate)
    assert.equal(
      await license.beneficiarySaleBasisPoints(),
      beneficiarySaleBasisPoints
    )
    assert.equal(
      await license.beneficiaryTaxBasisPoints(),
      beneficiaryTaxBasisPoints
    )
  })

  it("Can be bought for the assessed value", async () => {

    // when bought from the creator, the assessment is split according
    // to the beneficiary sale basis points
    const bobAssessedValue = web3.toWei("11", "ether")
    await license.buy(
      bobAssessedValue,
      attestation,
      {value: assessedValue, from: bob}
    )
    const reportedAssessedValue = await license.assessedValue()
    assert.equal(await license.licenseHolder(), bob)
    assert.equal(
      reportedAssessedValue.toNumber(),
      bobAssessedValue,
      "incorrect assessed value"
    )

    // carol got carol's basis points
    const carolShare = (assessedValue * beneficiarySaleBasisPoints) / 10000
    const carolBalance = await license.balanceOf(carol)
    assert.equal(
      carolShare,
      carolBalance.toNumber(),
      "Incorrect value to beneficiary"
    )
    // alice got the rest
    const aliceShare = assessedValue - carolShare
    const aliceBalance = await license.balanceOf(alice)
    assert.equal(
      aliceShare,
      aliceBalance.toNumber(),
      "Incorrect value to previous owner(creator)"
    )

    // when bought from bob (not the creator) bob get's bob's full assessment
    const vickAssessedValue = web3.toWei("12", "ether")
    await license.buy(
      vickAssessedValue,
      attestation,
      {value: bobAssessedValue, from: vick}
    )
    const bobBalance = await license.balanceOf(bob)
    assert.equal(
      bobAssessedValue,
      bobBalance.toNumber(),
      "Incorrect value to previous owner"
    )
  })

  it("Can be reassessed by the license holder", async () => {
    // the beneficiary can reassess while they still hold the license
    const newValue = web3.toWei("9", "ether")
    assert.equal(
      alice,
      await license.licenseHolder(),
      "Expected alice to be the license holder"
    )
    await license.assessValue(newValue, {from: alice})
    const reportedValue = async () => {
      const v = await license.assessedValue()
      return v.toNumber()
    }
    assert.equal(newValue, await reportedValue())

    // no one else can
    await assertReverts(
      async () => {await license.assessValue(100, {from: bob})},
      "Unauthroized assessment attempt",
      "Bob was able to assess while Alice owns"
    )
    await assertReverts(
      async () => {await license.assessValue(50000, {from: carol})},
      "Unauthroized assessment attempt",
      "Carol was able to assess while Alice owns"
    )
    await assertReverts(
      async () => {await license.assessValue(3000, {from: vick})},
      "Unauthroized assessment attempt",
      "Vick was able to assess while Alice owns"
    )
    // until they buy the license
    const carolValue = web3.toWei("5", "ether")
    await license.buy(carolValue, attestation, {value: newValue, from: carol})
    assert.equal(carolValue, await reportedValue())
    const carolNewValue = web3.toWei("6", "ether")
    assert.equal(
      carol,
      await license.licenseHolder(),
      "Expected carol to be the license holder"
    )
    await license.assessValue(carolNewValue, {from: carol})
    assert.equal(carolNewValue, await reportedValue())

    // and no one else
    await assertReverts(
      async () => {await license.assessValue(100, {from: alice})},
      "Unauthroized assessment attempt",
      "Alice was able to assess when Carol owns",
    )
    await assertReverts(
      async () => {await license.assessValue(50000, {from: bob})},
      "Unauthroized assessment attempt",
      "Bob was able to assess when Carol owns"
    )
    await assertReverts(
      async () => {await license.assessValue(3000, {from: vick})},
      "Unauthroized assessment attempt",
      "Vick was able to assess while Carol owns"
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
    await assertReverts(
      async () => {await license.withdraw(1000, {from: bob})},
      "insufficient funds"
    )
  })

  it("Taxes the license holder", async () => {
    const bobAssessment = web3.toWei("10", "ether")
    await license.buy(
      bobAssessment,
      attestation,
      {value: assessedValue, from: bob}
    )
    // zero alice's and carol's balance (they both earned when bob bought)
    await license.withdraw(
      (await license.balanceOf(alice)).toNumber(),
      {from: alice}
    )
    await license.withdraw(
      (await license.balanceOf(carol)).toNumber(),
      {from: carol}
    )
    const bobDeposit = web3.toWei("1", "ether")
    await license.deposit({value: bobDeposit, from: bob})
    const wait = (seconds) => {
      return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [seconds],
          id: 0
        }, async (err, result) => {
          if (err) { reject(err) }
          else { resolve(result) }
        })
      })
    }
    const year = 31536000 // in seconds
    await wait(year)
    await forceMine()
    const bobBeforeTaxBalance = await license.balanceOf(bob)
    await license.collectTaxes()
    const bobAfterTaxBalance = await license.balanceOf(bob)
    assert.equal(
      bobAfterTaxBalance.toNumber(),
      24112000, // the accumulated rounding error by using "tax per second"
      // fix this!!!
      "incorrect deposit remaining"
    )
    const aliceAfterTaxBalance = await license.balanceOf(alice)
    const carolAfterTaxBalance = await license.balanceOf(carol)
    const totalTax = aliceAfterTaxBalance.plus(carolAfterTaxBalance)
    assert.equal(
      bobDeposit,
      aliceAfterTaxBalance
        .plus(carolAfterTaxBalance)
        .plus(bobAfterTaxBalance)
        .toNumber(),
      "incorrect total tax"
    )

    // TODO: check that alice and carol get the right proportions
  })
})

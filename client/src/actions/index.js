import { networks, abi as licenseAbi } from 'contracts/COSTLicense.json'
import { store } from '../reducers'

export const actionTypes = {
  SET_WEB3: "SET_WEB3",
  SET_DEFAULT_ACCOUNT: "SET_DEFAULT_ACCOUNT",
  UPDATE_LICENSE_DETAILS: "GET_LICENSE_DETAILS",
  SET_CONTRACT: "SET_CONTRACT"
}

export function setWeb3(web3) {
  return {
    type: actionTypes.SET_WEB3,
    web3
  }
}

export function setDefaultAccount() {
  return async (dispatch, getState) => {
    const web3 = getState().web3
    web3.eth.getAccounts((err, accounts) => {
      dispatch({
        type: actionTypes.SET_DEFAULT_ACCOUNT,
        account: accounts[0]
      })
    })
  }
}

export function setContract() {
  const web3 = store.getState().web3
  const contract = new web3.eth.Contract(
    licenseAbi,
    networks[1539206626441].address
  )
  return {
    type: actionTypes.SET_CONTRACT,
    contract
  }
}

export function getLicenseDetails() {
  return async (dispatch, getState) => {
    const contract = getState().licenseContract
    const licenseHolder = await contract.methods.licenseHolder().call()
    const assessedValue = await contract.methods.assessedValue().call()
    dispatch({
      type: actionTypes.UPDATE_LICENSE_DETAILS,
      details: {
        licenseHolder,
        assessedValue
      }
    })
  }
}



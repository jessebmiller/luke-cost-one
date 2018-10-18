import thunk from 'redux-thunk'
import { combineReducers, createStore, applyMiddleware } from 'redux'
import { actionTypes } from '../actions'

function web3Reducer(web3=null, action) {
  if (action.type === actionTypes.SET_WEB3) {
    return action.web3
  }
  return web3
}

function licenseContractAddressReducer(addr=null, action) {
  if (action.type === actionTypes.SET_CONTRACT_ADDRESS) {
    return action.address
  }
  return addr
}

function licenseContractReducer(contract=null, action) {
  if (action.type === actionTypes.SET_CONTRACT) {
    return action.contract
  }
  return contract
}

function licenseDetailsReducer(details={}, action) {
  if (action.type === actionTypes.UPDATE_LICENSE_DETAILS) {
    return Object.assign({}, details, action.details)
  }
  return details
}

function defaultAccountReducer(account=null, action) {
  if (action.type === actionTypes.SET_DEFAULT_ACCOUNT) {
    return action.account
  }
  return account
}

export const rootReducer = combineReducers({
  web3: web3Reducer,
  licenseContractAddress: licenseContractAddressReducer,
  licenseDetails: licenseDetailsReducer,
  licenseContract: licenseContractReducer,
  defaultAccount: defaultAccountReducer
})

export const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
)

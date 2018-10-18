import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import './index.css';
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import {
  setWeb3,
  setContract,
  getLicenseDetails,
  setDefaultAccount } from './actions'
import { store } from './reducers'
import Web3 from 'web3'

window.addEventListener('load', async function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  // eslint-disable-next-line
  if (typeof web3 !== 'undefined') {
    // Use the browser's ethereum provider
    // eslint-disable-next-line
    store.dispatch(setWeb3(new Web3(web3.currentProvider)))
    store.dispatch(setDefaultAccount())
    store.dispatch(setContract())
    store.dispatch(await getLicenseDetails())
  } else {
    console.log('No web3? You should consider trying MetaMask!')
  }
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root'))
  registerServiceWorker()
})


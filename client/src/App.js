import { LicenseSummaryContainer } from './components/LicenseSummaryContainer.js'
import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import { store } from './reducers'

class App extends Component {
  render() {
    return store.getState().web3 ? (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Harberger Quilt</h1>
        </header>
        <p className="App-intro">
          Current info about the quilt
        </p>
        <LicenseSummaryContainer />
      </div>
    ) : (
      <h1>Web3 not found.</h1>
    )
  }
}

export default App

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Harberger Quilt</h1>
        </header>
        <p className="App-intro">
          Here is where you will be able to purchase the licence to display.
        </p>
      </div>
    );
  }
}

export default App;

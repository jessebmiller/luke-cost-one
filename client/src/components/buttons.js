import React from 'react'
import { store } from '../reducers'

function setAssessment(value) {
  const state = store.getState()
  const contract = state.licenseContract
  const account = state.defaultAccount
  const valueInEth = state.web3.utils.toWei(value, 'ether')
  contract.methods.assessValue(valueInEth).send({from: account})
}

export class SetAssessmentButton extends React.Component {

  constructor(props) {
    super(props)
    this.state = {value: ""}

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    this.setState({value: event.target.value})
  }

  handleSubmit(event) {
    event.preventDefault()
    setAssessment(this.state.value)
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          New Assessment:
          <input
            type="text"
            min="0"
            name="assessment"
            value={this.state.value}
            onChange={this.handleChange}
            />
        </label>
        <input type="submit" value="Submit" />
      </form>
    )
  }
}

export function BuyButton(props) {
  return <button>Buy</button>
}

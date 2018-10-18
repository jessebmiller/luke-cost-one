import React from 'react'
import { connect } from 'react-redux'
import LicenseSummary from './LicenseSummary.js'
import { store } from '../reducers'

const Component = (props) => {
  const web3 = store.getState().web3
  const assessedValue = props.assessedValue
        ? web3.utils.fromWei("" + props.assessedValue, 'ether')
        : "fetching assessed value..."
  return (
    <LicenseSummary
      defaultAccount={props.defaultAccount}
      licenseHolder={props.licenseHolder}
      assessedValue={assessedValue}
      />
  )
}

const mapStateToProps = (state) => {
  return {
    defaultAccount: state.defaultAccount,
    ...state.licenseDetails
  }
}

export const LicenseSummaryContainer = connect(mapStateToProps)(Component)

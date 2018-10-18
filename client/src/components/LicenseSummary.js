import React from 'react'

import { SetAssessmentButton, BuyButton } from './buttons'

export default function LicenseSummary (props) {
  return (
    <div>
      <h1>Assessed Value: {props.assessedValue} ETH</h1>
      {props.defaultAccount === props.licenseHolder
        ? <SetAssessmentButton />
        : <BuyButton />
      }
    </div>
  )
}

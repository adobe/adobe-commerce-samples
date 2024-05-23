/* 
* <license header>
*/

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Flex,
  Heading,
  Form,
  Picker,
  TextArea,
  ActionButton,
  StatusLight,
  ProgressCircle,
  Item,
  Text,
  View
} from '@adobe/react-spectrum'
import Function from '@spectrum-icons/workflow/Function'

import allActions from '../config.json'
import actionWebInvoke from '../utils'

// remove the deprecated key
const actions = Object.keys(allActions).reduce((obj, key) => {
  if (key.lastIndexOf('/') > -1) {
    obj[key] = allActions[key]
  }
  return obj
}, {})

const ActionsForm = (props) => {
  const [state, setState] = useState({
    actionSelected: null,
    actionResponse: null,
    actionResponseError: null,
    actionHeaders: null,
    actionHeadersValid: null,
    actionParams: null,
    actionParamsValid: null,
    actionInvokeInProgress: false,
    actionResult: ''
  })

  return (
    <View width="size-6000">
      <Heading level={1}>Run your application backend actions</Heading>
      {Object.keys(actions).length > 0 && (
        <Form necessityIndicator="label">
          <Picker
            label="Actions"
            isRequired={true}
            placeholder="select an action"
            aria-label="select an action"
            items={Object.keys(actions).map((k) => ({ name: k }))}
            itemKey="name"
            onSelectionChange={(name) =>
              setState({
                ...state,
                actionSelected: name,
                actionResponseError: null,
                actionResponse: null
              })
            }
          >
            {(item) => <Item key={item.name}>{item.name}</Item>}
          </Picker>

          <TextArea
            label="headers"
            placeholder='{ "key": "value" }'
            validationState={state.actionHeadersValid}
            onChange={(input) =>
              setJSONInput(input, 'actionHeaders', 'actionHeadersValid')
            }
          />

          <TextArea
            label="params"
            placeholder='{ "key": "value" }'
            validationState={state.actionParamsValid}
            onChange={(input) =>
              setJSONInput(input, 'actionParams', 'actionParamsValid')
            }
          />
          <Flex>
            <ActionButton
              variant="primary"
              type="button"
              onPress={invokeAction.bind(this)}
              isDisabled={!state.actionSelected}
            ><Function aria-label="Invoke" /><Text>Invoke</Text></ActionButton>

            <ProgressCircle
              aria-label="loading"
              isIndeterminate
              isHidden={!state.actionInvokeInProgress}
              marginStart="size-100"
            />
          </Flex>
        </Form>
      )}

      {state.actionResponseError && (
        <View padding={'size-100'} marginTop={'size-100'} marginBottom={'size-100'} borderRadius={'small '}>
          <StatusLight variant="negative">Failure! See the complete error in your browser console.</StatusLight>
        </View>
      )}
      {!state.actionResponseError && state.actionResponse && (
        <View padding={'size-100'} marginTop={'size-100'} marginBottom={'size-100'} borderRadius={'small '}>
          <StatusLight variant="positive">Success! See the complete response in your browser console.</StatusLight>
        </View>
      )}

      {Object.keys(actions).length === 0 && <Text>You have no actions !</Text>}
      <TextArea
        label="results"
        isReadOnly={true}
        width="size-6000"
        height="size-6000"
        maxWidth="100%"
        value={state.actionResult}
        validationState={(!state.actionResponseError) ? 'valid' : 'invalid'}
      />
    </View>
  )

  // Methods

  // parses a JSON input and adds it to the state
  async function setJSONInput (input, stateJSON, stateValid) {
    let content
    let validStr = null
    if (input) {
      try {
        content = JSON.parse(input)
        validStr = 'valid'
      } catch (e) {
        content = null
        validStr = 'invalid'
      }
    }
    setState({ ...state, [stateJSON]: content, [stateValid]: validStr })
  }

  // invokes a the selected backend actions with input headers and params
  async function invokeAction () {
    setState({ ...state, actionInvokeInProgress: true, actionResult: 'calling action ... ' })
    const actionName = state.actionSelected
    const headers = state.actionHeaders || {}
    const params = state.actionParams || {}
    const startTime = Date.now()
    // all headers to lowercase
    Object.keys(headers).forEach((h) => {
      const lowercase = h.toLowerCase()
      if (lowercase !== h) {
        headers[lowercase] = headers[h]
        headers[h] = undefined
        delete headers[h]
      }
    })
    // set the authorization header and org from the ims props object
    if (props.ims.token && !headers.authorization) {
      headers.authorization = `Bearer ${props.ims.token}`
    }
    if (props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = props.ims.org
    }
    let formattedResult = ''
    try {
      // invoke backend action
      const actionResponse = await actionWebInvoke(actions[actionName], headers, params)
      formattedResult = `time: ${Date.now() - startTime} ms\n` + JSON.stringify(actionResponse, 0, 2)
      // store the response
      setState({
        ...state,
        actionResponse,
        actionResult: formattedResult,
        actionResponseError: null,
        actionInvokeInProgress: false
      })
      console.log(`Response from ${actionName}:`, actionResponse)
    } catch (e) {
      // log and store any error message
      formattedResult = `time: ${Date.now() - startTime} ms\n` + e.message
      console.error(e)
      setState({
        ...state,
        actionResponse: null,
        actionResult: formattedResult,
        actionResponseError: e.message,
        actionInvokeInProgress: false
      })
    }
  }
}

ActionsForm.propTypes = {
  runtime: PropTypes.any,
  ims: PropTypes.any
}

export default ActionsForm

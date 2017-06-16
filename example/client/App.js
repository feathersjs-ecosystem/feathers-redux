import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import SimpleInput from 'react-simple-input';

var text = 'initial value';
var id = '';

class App extends Component {
  render() {
    const { getServicesStatus, reduxState: { messages: messagesState } } = this.props;
    
    return (
      <div className="App">
        <div className="App-header">
          <img src="./logo.svg" className="App-logo" alt="logo" />
          feathers-redux
        </div>
        <div className="App-controls">
          <br />
          <SimpleInput placeholder="text for message" onChange={value => { text = value; }} />
          <button onClick={this.props.onCreate}>Create message</button>
          <br />
          <br />
          <SimpleInput placeholder="id for message" onChange={value => { id = value; }} />
          <button onClick={this.props.onGet}>Get message</button>
          <button onClick={this.props.onRemove}>Remove message</button>
          <br />
          <br />
          <SimpleInput placeholder="id for message" onChange={value => { id = value; }} />
          <SimpleInput placeholder="new text for message" onChange={value => { text = value; }} />
          <button onClick={this.props.onPatch}>Patch message</button>
          <br />
          <br />
          <button onClick={this.props.onFind}>Retrieve all messages</button>
          <br />
          <br />
        </div>
        <br />
        <div className="App-status">
          Status:
          <span style={{ fontStyle: 'italic' }}>
            {getServicesStatus(this.props.reduxState, ['users', 'messages']).message || ''}
          </span>
          <br />
          <br />
          state.messages.data:
          <figure>
            <pre>
              <code>
                {messagesState.data ? JSON.stringify(messagesState.data, null, 2) : ''}
              </code>
            </pre>
          </figure>
          <br />
          state.messages.queryResult:
          <figure>
            <pre>
              <code>
                {messagesState.queryResult ? JSON.stringify(messagesState.queryResult, null, 2) : ''}
              </code>
            </pre>
          </figure>
          <br />
          <br />
          state.messages.store:
          <figure>
            <pre>
              <code>
                {messagesState.store ? JSON.stringify(messagesState.store, null, 2) : ''}
              </code>
            </pre>
          </figure>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  reduxState: state,
});

const mapDispatchToProps = (dispatch, { services }) => ({
  onCreate: () => {
    dispatch(services.messages.create({ text }));
  },
  onGet: () => {
    dispatch(services.messages.get(id));
  },
  onPatch: () => {
    dispatch(services.messages.patch(id, { text }));
  },
  onRemove: () => {
    dispatch(services.messages.remove(id));
  },
  onFind: () => {
    dispatch(services.messages.find());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(App);

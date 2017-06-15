import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import SimpleInput from 'react-simple-input';
import { services, getServicesStatus } from './feathers';

// import logo from './logo.svg';
// import './App.css';
var text = 'initial value'; // eslint-disable-line no-var
var id = ''; // eslint-disable-line no-var

class App extends Component {
  static propTypes = {
    servicesState: PropTypes.object.isRequired,
    onCreate: PropTypes.func.isRequired,
    onGet: PropTypes.func.isRequired,
    onFind: PropTypes.func.isRequired,
  };

  getStatusMessage() {
    const status = getServicesStatus(this.props.servicesState, ['users', 'messages']);
    return status.message || '';
  }

  render() {
    const { messages } = this.props.servicesState;
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
          <button onClick={this.props.onFind}>Retrieve some messages</button>
          <br />
          <br />
        </div>
        <br />
        <div className="App-status">
          Status:
          <span style={{ fontStyle: 'italic' }}> {this.getStatusMessage()}</span>
          <br />
          <br />
          state.messages.data:
          <figure>
            <pre>
              <code>
                {messages.data ? JSON.stringify(messages.data, null, 2) : ''}
              </code>
            </pre>
          </figure>
          <br />
          state.messages.queryResult:
          <figure>
            <pre>
              <code>
                {messages.queryResult ? JSON.stringify(messages.queryResult, null, 2) : ''}
              </code>
            </pre>
          </figure>
          <br />
          <br />
          state.messages.store:
          <figure>
            <pre>
              <code>
                {messages.store ? JSON.stringify(messages.store, null, 2) : ''}
              </code>
            </pre>
          </figure>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  servicesState: state,
  messages: state.messages,
});

const mapDispatchToProps = (dispatch) => ({
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

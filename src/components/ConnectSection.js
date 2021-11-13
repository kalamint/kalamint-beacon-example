import React from 'react';

import { connectBeacon } from '../util/kalamint';
import { Section } from './Section';

export class ConnectSection extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        account: "There's no account currently connected",
        network: "",
        selectedNet: "mainnet",
      };
  
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleChange(event) {
      this.setState({ ...this.state, selectedNet: event.target.value });
    }
  
    async handleSubmit(event) {
      event.preventDefault();
      const response = await connectBeacon();
  
      this.setState({
        ...this.state,
        account: response.address,
        network: response.network.type,
      });
    }
  
    render() {
      return (
        <Section name="Permission">
          <p>Address: {this.state.account}</p>
          <p>Network: {this.state.network}</p>
          <select value={this.state.value} onChange={this.handleChange}>
            <option value="mainnet">Mainnet</option>
          </select>
          <button className="btn-permission" onClick={this.handleSubmit}>
            Connect Wallet
          </button>
        </Section>
      );
    }
  }
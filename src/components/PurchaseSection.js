import React from 'react';

import { bidAuction, purchaseItem } from '../util/kalamint';
import { Section } from './Section';

export class PurchaseSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = { amount: 0, item: 0 };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        const target = event.target;
        const name = target.name;
        this.setState({ [name]: target.value });
    }

    async handleSubmit(event) {
        const target = event.target;
        const name = target.name;

        event.preventDefault();

        if (name === 'bid') {
            await bidAuction(Math.floor(Number(this.state.amount) * (10 ** 6)), this.state.item);
        } else if (name === 'buy') {
            await purchaseItem(Math.floor(Number(this.state.amount) * (10 ** 6)), this.state.item);
        }
    }

    render() {
        return (
            <Section name="Buy an item">
            <label htmlFor="amount">Amount</label>
            <br />
            <input
                value={this.state.amount}
                pattern='^\d+(?:\.\d{1,2})?$'
                step='0.000001'
                type='number'
                name='amount'
                placeholder='Price'
                onChange={this.handleChange}
                />
            <br />
            <label htmlFor="item">Item</label>
            <br />
            <input
                value={this.state.item}
                type="number"
                name="item"
                placeholder="Item number"
                onChange={this.handleChange}
                />
            <br />
            <button onClick={this.handleSubmit} name="buy">Buy</button>
            <button onClick={this.handleSubmit} name="bid">Bid</button>
        </Section>
        );
    }
}

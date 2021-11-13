import React from 'react';

import { getItemAsset, getAuctionAsset, loadAssetData } from '../util/kalamint';
import { Section } from './Section';

export class ViewSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = { item: 0, itemData: '', itemLoaded: false, direct: false };
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

        this.setState({ ['itemLoaded']: false });
        this.setState({ ['itemData']: false });

        event.preventDefault();

        if (name === 'auction') {
            const r = await getAuctionAsset(this.state.item);
            const d = await loadAssetData(r.assetURL, true);

            this.setState({ ['itemData']: d.data });
            this.setState({ ['itemLoaded']: true });
        } else if (name === 'item') {
            const r = await getItemAsset(this.state.item);
            const d = await loadAssetData(r.assetURL, true);

            console.log(d)
            this.setState({ ['itemData']: d.data });
            this.setState({ ['itemLoaded']: true });
        }
    }

    render() {
        return (
            <Section name="View item">
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
            <button onClick={this.handleSubmit} name="auction">View Action</button>
            <button onClick={this.handleSubmit} name="item">View Item</button>
            {this.state.itemLoaded && (<img src={this.state.itemData} />)}
        </Section>
        );
    }
}

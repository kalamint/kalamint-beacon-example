import React from 'react';

import { mintItem } from '../util/kalamint';
import { Section } from './Section';

export class MintSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            category: '',
            collectionName: '',
            creatorName: '',
            assetUrl: '',
            title: '',
            price: 1_000_000,
            metadataUrl: ''
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        const target = event.target;
        const name = target.name;
        this.setState({ [name]: target.value });
    }

    async handleSubmit(event) {
        event.preventDefault();

        const category = this.state.category;
        const collectionName = this.state.collectionName;
        const creatorName = this.state.creatorName;
        const assetUrl = this.state.assetUrl;
        const title = this.state.title;
        const price = Number(this.state.price);
        const metadataUrl = this.state.metadataUrl;

        const symbol = '';
        const onSale = true;
        const keywords = '';
        const creatorRoyalty = 10;
        const editions = Number(this.state.editions);

        await mintItem(category, collectionName, creatorName, creatorRoyalty, editions, assetUrl, keywords, title, onSale, price, symbol, metadataUrl);
    }

    render() {
        return (
            <Section name="Mint item">
            <input
                value={this.state.creatorName}
                type="text"
                name="creatorName"
                placeholder="Creator"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.title}
                type="text"
                name="title"
                placeholder="Title"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.category}
                type="text"
                name="category"
                placeholder="Category"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.collectionName}
                type="text"
                name="collectionName"
                placeholder="Collection Name"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.price}
                type="number"
                name="price"
                placeholder="Price"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.editions}
                type="number"
                name="editions"
                placeholder="Editions"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.assetUrl}
                type="text"
                name="assetUrl"
                placeholder="Asset URL"
                onChange={this.handleChange}
                
                />
            <br />
            <input
                value={this.state.metadataUrl}
                type="text"
                name="metadataUrl"
                placeholder="Metadata URL"
                onChange={this.handleChange}
                
                />
            <br />
            <button onClick={this.handleSubmit} name="mint">Mint</button>
            {this.state.itemLoaded && (<img src={this.state.itemData} />)}
        </Section>
        );
    }
}
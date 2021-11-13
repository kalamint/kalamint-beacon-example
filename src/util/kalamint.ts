import { BeaconBaseMessage, DAppClient, PermissionScope, PermissionResponseOutput, PartialTezosTransactionOperation, OperationResponseOutput, NetworkType, TezosOperationType } from "@airgap/beacon-sdk";
import { TezosMessageUtils, TezosNodeReader } from 'conseiljs';
import { JSONPath } from 'jsonpath-plus';
import { proxyFetch, ImageProxyServer, ImageProxyDataType } from 'nft-image-proxy';

export const client = new DAppClient({ name: "kalamint-beacon-example" });

const imageProxyURL = 'https://imgproxy-prod.cryptonomic-infra.tech';
const imageAPIKey = 'jHYZq3EESwFeclVh1ccpHa9TG7CWIgvFk8tLHCZBhB8QrvLvJGeinS5PoRrQAd1d';
const tezosNodeURL = 'https://tezos-prod.cryptonomic-infra.tech';
const kalamintContract = 'KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse';
const henMarketContract = 'KT1HbQepzV1nVGg8QVznG7z4RcHseD5kwqBn';
const henTokenContract = 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton';

/**
 * Initializes Beacon state by prompting the user to connect a wallet.
 * 
 * @param network Defaults to mainnet
 * @returns 
 */
export async function connectBeacon(network: NetworkType = NetworkType.MAINNET) {
    const activeAccount = await client.getActiveAccount();
    if (activeAccount) { return activeAccount };

    const permissionResponse: PermissionResponseOutput | void = await client
        .requestPermissions({ scopes: [PermissionScope.OPERATION_REQUEST], network: { type: network } })
        .then((response: PermissionResponseOutput) => response)
        .catch((permissionError: BeaconBaseMessage) => console.error(permissionError));

    return permissionResponse;
}

async function send(operations: PartialTezosTransactionOperation[]) {   
    client.requestOperation({ operationDetails: operations })
        .then((response: OperationResponseOutput) => console.log("transaction hash", response.transactionHash))
        .catch((operationError: BeaconBaseMessage) => console.error(operationError));
}

/**
 * Calls the buy entry point of the kalamint contract via Beacon.
 * @param amount Purchase price in µtz
 * @param itemid Item id
 */
export async function purchaseItem(amount: number, itemid: number) {
    await send([{
        kind: TezosOperationType.TRANSACTION,
        amount: amount + '',
        destination: kalamintContract, // kalamint contract
        parameters: {
            entrypoint: 'buy',
            value: JSON.parse(`{ "int": "${itemid}" }`),
        }
    }]);
}

/**
 * Calls the bid entry point of the kalamint contract via Beacon.
 * 
 * @param amount Bid amount in µtz
 * @param auctionid Auction id
 */
export async function bidAuction(amount: number, auctionid: number) {
    await send([{
        kind: TezosOperationType.TRANSACTION,
        amount: amount + '',
        destination: kalamintContract,
        parameters: {
            entrypoint: 'bid',
            value: JSON.parse(`{ "int": "${auctionid}" }`),
        }
    }]);
}

/**
 * Gets an asset URL for an NFT by id.
 * 
 * @param itemid NTF id.
 * @returns { itemid: number, price: string, assetURL: string } `itemid` is the NFT id, pass-through from the argument. `price` is the listed price of the NFT if available, `assetURL` is the actual NFT asset location.
 */
export async function getItemAsset(itemid: number): Promise<{ itemid: number, price: string, assetURL: string }> {
    const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(itemid, 'int'), 'hex'));

    try {
        const mapResult = await TezosNodeReader.getValueForBigMapKey(tezosNodeURL, 861, packedKey);

        const price = (Number(JSONPath({ path: '$.args[3].int', json: mapResult })[0]) / 10 ** 6).toFixed(6);
        const assetURL = JSONPath({ path: '$.args[4].string', json: mapResult })[0]

        return { itemid, price, assetURL };
    } catch (err) {
        console.log(err);
    }
    
    return { itemid, price: '', assetURL: '' };
}

/**
 * Returns auction information.
 * 
 * @param auctionid 
 * @returns { itemid: number, price: string, assetURL: string } `itemid` is the item on sale in the auction, which currently is the same as auction id. `price` is the sum of current high bid and bid increment, which would be the lowest next bid. `assetURL` is the actual NFT asset location.
 */
export async function getAuctionAsset(auctionid: number): Promise<{ itemid: number, price: string, assetURL: string }> {
    console.log('getAuctionAsset')
    try {
        const mainStorage = await TezosNodeReader.getContractStorage(tezosNodeURL, kalamintContract);
        const auctionMap = JSONPath({ path: '$.args[0].args[0].args[3]..args', json: mainStorage });
        const auctions = auctionMap.map((a: any[]) => { return { auctionid: a[0]['int'], contract: a[1]['string'] }; }).reduce((a: any, c: any) => { a[c['auctionid']] = c['contract']; return a; }, {});

        const auctionContract = auctions[`${auctionid}`]
        const auctionStorage = await TezosNodeReader.getContractStorage(tezosNodeURL, auctionContract);

        const itemid = JSONPath({ path: '$.args[0].args[0].args[0].int', json: auctionStorage })[0];
        const currentBid = (Number(JSONPath({ path: '$.args[0].args[0].args[1].int', json: auctionStorage })[0]));
        const increment = (Number(JSONPath({ path: '$.args[1].args[1].int', json: auctionStorage })[0]));
        const price = ((currentBid + increment) / 10 ** 6).toFixed(6);

        const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(itemid, 'int'), 'hex'));
        const itemStorage = await TezosNodeReader.getValueForBigMapKey(tezosNodeURL, 861, packedKey);
        const assetURL = JSONPath({ path: '$.args[4].string', json: itemStorage })[0]

        return { itemid, price, assetURL };
    } catch (err) {
        console.log(err);
    }

    return { itemid: 0, price: '', assetURL: '' };
}

/**
 * Loads the asset data via the Cryptonomic image proxy or URL. The image proxy offers content rating, filtering and caching. For more information see https://github.com/Cryptonomic/ImageProxy.
 * 
 * @param assetURL Asset URL from the NFT metadata, https or ipfs.
 * @param direct Return the direct URL instead of hitting the proxy.
 * @returns {data: any, error: string} The `data` attribute will contain either the URL of the asset, including http/ipfs redirect or the data from the image proxy. `error` object will contain proxy moderation information and other errors if they occur.
 */
export async function loadAssetData(assetURL: string, direct: boolean = false): Promise<{data: any, error?: string}> {
    if (direct) {
        if (assetURL.startsWith('ipfs')) {
            return { data: `https://cloudflare-ipfs.com/ipfs/${assetURL.slice(7)}` };
        }

        return { data: assetURL };
    } else {
        const server: ImageProxyServer = { url: imageProxyURL, apikey: imageAPIKey, version: '1.0.0' };

        const r = await proxyFetch(server, assetURL, ImageProxyDataType.Json, false)
            .then((d: any) => {
                if (d.rpc_status === 'Ok') {
                    if (d.result.moderation_status === 'Allowed') {
                        return { data: d.result.data };
                    } else if (d.result.moderation_status === 'Blocked') {
                        return {data: '', error: `Image was hidden because of it contains the following labels: ${d.result.categories.join(', ')}`};
                    }
                } else if (d.rpc_status === 'Err') {
                    if (assetURL.startsWith('ipfs')) {
                        return { data: `https://cloudflare-ipfs.com/ipfs/${assetURL.slice(7)}` };
                    }
                    return { data: assetURL };
                }
            })
            .catch(e => {
                if (assetURL.startsWith('ipfs')) {
                    return { data: `https://cloudflare-ipfs.com/ipfs/${assetURL.slice(7)}`, error: 'failed to contact media proxy' };
                }
        
                return { data: assetURL, error: 'failed to contact media proxy' };
            });

        return {data: '', error: 'failed to fetch asset data'};
    }
}

/**
 * Wrapper for the Kalamint mint operation.
 * 
 * @param category 
 * @param collectionName 
 * @param creatorName 
 * @param creatorRoyalty 
 * @param editions 
 * @param assetUrl Asset URL string, including protocol
 * @param keywords 
 * @param title 
 * @param onSale 
 * @param price Price, expressed as µtz
 * @param symbol 
 * @param metadataUrl Metadata file URL string, including protocol
 */
export async function mintItem(category: string, collectionName: string, creatorName: string, creatorRoyalty: number, editions: number, assetUrl: string, keywords: string, title: string, onSale: boolean, price: number, symbol: string, metadataUrl: string) {

    const mainStorage = await TezosNodeReader.getContractStorage(tezosNodeURL, kalamintContract);
    const collectionId = editions > 1 ? JSONPath({ path: '$.args[0].args[0].args[0].args[1].int', json: mainStorage })[0] : 0;
    const tokenId = JSONPath({ path: '$.args[0].args[0].args[1].int', json: mainStorage })[0];

    const params = `{ "prim": "Pair", "args": [ { "prim": "Pair", "args": [ { "prim": "Pair", "args": [ { "string": "${category}" }, { "prim": "Pair", "args": [ { "int": "${collectionId}" }, { "string": "${collectionName}" } ] } ] }, { "prim": "Pair", "args": [ { "prim": "Pair", "args": [ { "string": "${creatorName}" }, { "int": "${creatorRoyalty}" } ] }, { "prim": "Pair", "args": [{ "int": "${editions}" }, { "string": "${assetUrl}" } ] } ] } ] }, { "prim": "Pair", "args": [ { "prim": "Pair", "args": [ { "string": "${keywords}" }, { "prim": "Pair", "args": [ { "string": "${title}" }, { "prim": "${ onSale ? 'True' : 'False' }" } ] } ] }, { "prim": "Pair", "args": [ { "prim": "Pair", "args": [{ "int": "${price}" }, { "string": "${symbol}" } ] }, { "prim": "Pair", "args": [ { "int": "${tokenId}" }, { "bytes": "${Buffer.from(metadataUrl).toString('hex')}" } ] } ] } ] } ] }`;

    await send([{
        kind: TezosOperationType.TRANSACTION,
        amount: '0',
        destination: kalamintContract,
        parameters: {
            entrypoint: 'mint',
            value: JSON.parse(params)
        }
    }]);
}

/**
 * Returns objktid for a given HEN swap.
 * 
 * @returns 
 */
export async function getHENSwapInfo(swapid: number | string): Promise<{ objktid: string }> {
    try {
        const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(swapid, 'int'), 'hex'));
        const swapStorage = await TezosNodeReader.getValueForBigMapKey(tezosNodeURL, 6072, packedKey);

        const objktid = JSONPath({ path: '$.args[1].int', json: swapStorage })[0];

        return { objktid };
    } catch (err) {
        console.log(err);
    }

    return { objktid: '-1' };
}

/**
 * Buys a listing on the hic et nunc market
 * 
 * @param amount Price to pay, in µtz
 * @param swapid Sale id
 */
export async function buyHENItem(amount: number, swapid: number, objktid?: number | string) {
    if (objktid !== undefined) {
        const swapInfo = await getHENSwapInfo(swapid);

        if (swapInfo.objktid !== objktid.toString()) {
            throw new Error(`swap ${swapid} item ${swapInfo.objktid} does not match requested item ${objktid}`);
        }
    }

    await send([{
        kind: TezosOperationType.TRANSACTION,
        amount: amount + '',
        destination: henMarketContract,
        parameters: {
            entrypoint: 'collect',
            value: JSON.parse(`{ "int": "${swapid}" }`),
        }
    }]);
}

/**
 * Gets creator and royalty for a given objktid.
 * 
 * @returns 
 */
export async function getHENRoyaltyInfo(objktid: number | string): Promise<{ objktid: number | string, royalty: number, creator: string }> {
    try {
        const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(objktid, 'int'), 'hex'));
        const royaltyStorage = await TezosNodeReader.getValueForBigMapKey(tezosNodeURL, 522, packedKey);
        const creator = JSONPath({ path: '$.args[0].string', json: royaltyStorage })[0];
        const royalty = Number(JSONPath({ path: '$.args[1].int', json: royaltyStorage })[0]);

        return { objktid, royalty, creator };
    } catch (err) {
        console.log(err);
    }

    return { objktid: 0, royalty: 0, creator: '' };
}

/**
 * Lists an item for sale on the hic et nunc market. Internally it will get item details for royalties.
 * 
 * @param seller Address of the current owner.
 * @param objktid NFT id of the item to sell.
 * @param amount Number if tokens to sell.
 * @param price Price per token.
 */
export async function sellHENItem(seller: string, objktid: number | string, amount: number, price: number | string) {
    const r = await getHENRoyaltyInfo(objktid);

    const approve: PartialTezosTransactionOperation = {
        kind: TezosOperationType.TRANSACTION,
        amount: '0',
        destination: henTokenContract,
        parameters:  {
            entrypoint: 'update_operators',
            value: JSON.parse(`{ "prim": "Left", "args": [ { "prim": "Pair", "args": [ { "string": "${seller}" }, { "prim": "Pair", "args": [ { "string": "${henMarketContract}" }, { "int": "${objktid}" } ] } ] } ] }`),
        }
    };

    const list: PartialTezosTransactionOperation = {
        kind: TezosOperationType.TRANSACTION,
        amount: '0',
        destination: henMarketContract,
        parameters: {
            entrypoint: 'swap',
            value: JSON.parse(`{ "prim": "Pair", "args": [ { "prim": "Pair", "args": [ { "string": "${r.creator}" }, { "int": "${amount}" } ] } { "prim": "Pair", "args": [ { "int": "${objktid}}" }, { "prim": "Pair", "args": [ { "int": "${r.royalty}" }, { "int": "${price}" } ] } ] } ] }`),
        }
    };

    await send([approve, list]);
}

/**
 * Cancels a pending sale on the hic et nunc market.
 * 
 * @param swapid 
 */
export async function cancelHENSale(swapid: string | number) {
    await send([{
        kind: TezosOperationType.TRANSACTION,
        amount: '0',
        destination: henMarketContract,
        parameters: {
            entrypoint: 'cancel_swap',
            value: JSON.parse(`{ "int": "${swapid}" }`),
        }
    }]);
}

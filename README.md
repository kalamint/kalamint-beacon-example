# Kalamint Utils

These utilities make it easy to integrate Kalamint NFT features into your own website. There is one file that you'll need to include: `/util/kalamint.ts`.

## Requirements

The utility is written in Typescript. The sample application is a Javascript React app. This has been demonstrated to work with Node v12+, npm 6.14.13 with the latest build of Chrome as of 2021, Sept 22.

## Integration

Simply include `kalamint.ts` in your code to call its functions, see `components/PurchaseSection.js` for an example.

## Functionality

It's easy to add NFT listings into your exiting site of CMS with Beacon and these wrappers. The idea is that a user will connect a wallet to your site and you'll rely on these functions to interact with the chain.

### connectBeacon

Initializes [Beacon](https://www.walletbeacon.io/) state by prompting the user to connect a wallet.

### purchaseItem

Calls the buy entry point of the [Kalamint contract](https://better-call.dev/mainnet/KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse/code) via Beacon.

### bidAuction

Calls the bid entry point of the Kalamint contract via Beacon.

### getItemAsset

Gets an asset URL for an NFT by id.

### getAuctionAsset

Returns auction information.

### loadAssetData

Loads the asset data via the [Cryptonomic image proxy](https://github.com/Cryptonomic/ImageProxy) or URL. The image proxy requires an API key, which can be obtained per instructions provided on their site.

### MintAsset

Mints NFT calling the mint  entry point of the [Kalamint contract](https://better-call.dev/mainnet/KT1EpGgjQs73QfFJs9z7m1Mxm5MTnpC2tqse/code) via Beacon.


import { OktoClient } from '@okto_web3/core-js-sdk';
import {
  getAccount,
  getNftCollections,
  getOrdersHistory,
  getPortfolioActivity,
  getPortfolioNFT,
} from '@okto_web3/core-js-sdk/explorer';
import {
  nftTransfer,
  tokenTransfer,
  evmRawTransaction,
} from '@okto_web3/core-js-sdk/userop';

async function main() {
  console.log('Hello, Okto!');

  const oc = new OktoClient({
    environment: 'sandbox',
    vendorPrivKey:
      '0xadf2181a7b2dec0f1ed22061ab31bd6182691c619d9e874a956e71ab7ecca413',
    vendorSWA: '0x6b6Fad2600Bc57075ee560A6fdF362FfefB9dC3C',
  });

  await oc.loginUsingOAuth({
    idToken:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZhMDcyZjc1Nzg0NjQyNjE1MDg3YzcxODJjMTAxMzQxZTE4ZjdhM2EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDQwNDAxODg3NjczNzI2Mzk0MTEiLCJoZCI6ImNoaXRrYXJhLmVkdS5pbiIsImVtYWlsIjoic3JpamFuMTM4NC5iZTIxQGNoaXRrYXJhLmVkdS5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoicF9BWmxYRV9ucjZLd0RvOHpqVHFHUSIsIm5hbWUiOiJTcmlqYW4gU2FtcmlkaCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKSDdZVUxhS2ZpWk5ISzJ5MWJTeWN2VlR3ejgxVDNWSmttcDQzQWJZRUlnekRRbkRUVz1zOTYtYyIsImdpdmVuX25hbWUiOiJTcmlqYW4iLCJmYW1pbHlfbmFtZSI6IlNhbXJpZGgiLCJpYXQiOjE3Mzg3NTU5MzksImV4cCI6MTczODc1OTUzOX0.R98ZCvQa3br0SM_rJLDW7FyYvNskh6yXHn2spOGOIGaU1SbQRdhqeR4RmeFNtpyUVl_PqMJ26hV9LxYNgALkXIwGGiVreAX8ppJUueL6IWW24FlxcJEViHe0-fn5hnNlaPXuR9a2Yg8M2EvpvC9sYZXiRDREOX2eyIGO1iv6_11iF7UT251TGAkyicrVe6sJLWsszNWzRMqvOBQQSCLVOglhad8z5Rj9Hz10igxQueRowuV0JwkWFhMz4qbSt9uRXVjp2VJ9ffr2CdiAHPysJXm8nbPRX4Zl-WIonsm9RpfkqRh7EbHrhIhOIouNGjBtBZCaPF3FoQkR5ustDCrg1g',
    provider: 'google',
  });

  // try {
  //   const userinfo = oc.user;
  //   console.log('KARAN :: user', userinfo);
  //   const orderDetails = getNftCollections(oc);
  //   const account = getAccount(oc);
  //   console.log('KARAN :: account', account);
  //   console.log('KARAN :: orderDetails', orderDetails);
  //   const Portfoliodetails = getPortfolioNFT(oc);
  //   console.log('KARAN :: Portfoliodetails', Portfoliodetails);
  // } catch (error) {
  //   console.error('Failed to get orders:', error);
  // }

  try {
    const userOP = await tokenTransfer(oc, {
      chain: 'eip155:137',
      token: '0x9501f6020b0cf374918ff3ea0f2817f8fbdd0762',
      recipient: '0xEE54970770DFC6cA138D12e0D9Ccc7D20b899089',
      amount: 1,
    });
    console.log('userOP for nftTransfer', userOP);
    const signedUserOp = await oc.signUserOp(userOP);
    console.log('signed user for nftTransfer', signedUserOp);
    const response = await oc.executeUserOp(signedUserOp);
    console.log('nftTransfer executed ', response);
  } catch (error) {
    console.error('Failed to get NFT collections:', error);
  }

  // try {
  //   const userOP = await evmRawTransaction(oc, {
  //     caip2Id: 'eip155:1',
  //     transaction: {
  //       from: '0xYourFromAddress',
  //       to: '0xYourToAddress',
  //       data: '0xYourData',
  //       value: 1,
  //     },
  //   });
  //   console.log('userOP for evmRawTransaction', userOP);
  //   const signedUserOp = await oc.signUserOp(userOP);
  //   console.log('signed user for evmRawTransaction', signedUserOp);
  //   const response = await oc.executeUserOp(signedUserOp);
  //   console.log('evmRawTransaction executed ', response);
  // } catch (error) {
  //   console.error('Failed to execute evmRawTransaction:', error);
  // }
}

main();

import { OktoClient } from '@okto_web3/core-js-sdk';
import { getAccount, getPortfolioNFT } from '@okto_web3/core-js-sdk/explorer';
import {
  aptosRawTransaction,
  // nftCreateCollectionWithEstimate,
} from '@okto_web3/core-js-sdk/userop';
// import {
//   estimateAptosRawTransaction,
//   estimateEvmRawTransaction,
//   estimateNftCreateCollection,
//   estimateNftMint,
// } from '@okto_web3/core-js-sdk/userop';

async function main() {
  console.log('Hello, Okto!');

  const oc = new OktoClient({
    environment: 'sandbox',
    clientPrivateKey:
      '0xd6b6ee557483be9559ca898eca93c65ba88e9775663b49b5b9f69cc0aa97e276',
    clientSWA: '0x98D0464243b04121d49D87D8035e5D29F87c208C',
  });

  await oc.loginUsingOAuth({
    idToken:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY2MGVmM2I5Nzg0YmRmNTZlYmU4NTlmNTc3ZjdmYjJlOGMxY2VmZmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE4MTI5MjU3NTAxMDQ1MzA2NDUiLCJlbWFpbCI6InBhcm1pbmRlcnNpbmdob3V0bGluZXN5c3RlbXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ0cW81MFB3YjJYM1RvS3lrVXlnNzZnIiwibmFtZSI6IlBhcm1pbmRlciBTaW5naCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKZklwOVhNaUZJTElWSUE2MXZBQnRNODROQ0FISE5DaUd3VjhXY2lqa1pueWNOeUE9czk2LWMiLCJnaXZlbl9uYW1lIjoiUGFybWluZGVyIiwiZmFtaWx5X25hbWUiOiJTaW5naCIsImlhdCI6MTc0NzYzODMxNiwiZXhwIjoxNzQ3NjQxOTE2fQ.mYgehUeBlUzzqVCFi5BbOZ9hq7DEOwkyu6ROLvYAObJJ2fYWdNtvyazRfKMaUldv8YiUD1y16kglSrkV9HlaOKkLeHovzHTRPU9--mOtfAFkcpn2TGWXLWBKXT8SAo98uMS9y17t7xqZXi931HTJLIOWMSnWAXGxqvJyB2NjEcW5T3K7K4rjTcnChedz1A_cHegIj2wcL6eXMaU2Qp3Rz6u3LxgSb4c3mU1NTrpRXvbSZPfJbBPnZlzDFXXYMGJYqMh-jgzgEhYhqmBqPOJx0bnAFQl2AZ6cT_B90wdmVzaULU2hdmC676u4UBqRqjxDGFN5l5Z5dLqICLaE-2Bt8Q',
    provider: 'google',
  });

  try {
    const userinfo = oc.userSWA;
    console.log('KARAN :: user', userinfo);
    const account = getAccount(oc);
    console.log('KARAN :: account', account);
    const Portfoliodetails = getPortfolioNFT(oc);
    console.log('KARAN :: Portfoliodetails', Portfoliodetails);
  } catch (error) {
    console.error('Failed to get orders:', error);
  }

  // caip2Id,
  // transaction: {
  //   from,
  //   to,
  //   value: typeof value === "string" ? BigInt(value) : value,
  //   data: data || undefined,
  // },

  const aptosTransactionParams = {
    caip2Id: 'aptos:mainnet', // Aptos mainnet
    transactions: [
      {
        function: '0x1::aptos_account::transfer',
        typeArguments: [],
        functionArguments: [
          '0x86b853089ce1cc34ef1d616ba5565f8879a03f8bcbe77c3d74a057b5f3d082b3', // recipient address
          '3000000',
        ],
      },
    ],
  };

  // const transactionData = {
  //   caip2Id: 'aptos:mainnet',
  //   name: 'KARAN',
  //   uri: 'https://ipfs.io/ipfs/QmT434r64HQXdkpKo5fRCCn2PzxmQQPtXgGSnrUVzpPwaw',
  //   data: {
  //     attributes: 'This is an attribute',
  //     symbol: 'CRAZYNFTS',
  //     type: 'NFT',
  //     description: 'description',
  //   },
  // };

  try {
    const tokenransferestimate = await aptosRawTransaction(
      oc,
      aptosTransactionParams,
      '0xc639d4a31f3fE183D1816a9aC39518494208234F',
    );
    const userOP = tokenransferestimate;
    console.log('userOP for tokenransferestimate', userOP);
    const signedUserOp = await oc.signUserOp(userOP);
    console.log('signed user for tokenransferestimate', signedUserOp);
    const response = await oc.executeUserOp(signedUserOp);
    console.log('tokenransferestimate executed ', response);
  } catch (error) {
    console.error('Failed to get tokenransferestimate ', error);
  }
}

main();

import { OktoClient } from '@okto-sdk/core-js';
import {useAccount, useAuth, useChain, useToken} from '@okto-sdk/react-native';
async function main() {
  const oktoClient = new OktoClient({
    environment: 'sandbox',
    vendorPrivKey:
      '0xadf2181a7b2dec0f1ed22061ab31bd6182691c619d9e874a956e71ab7ecca413',
    vendorSWA: '0x6b6Fad2600Bc57075ee560A6fdF362FfefB9dC3C',
  });
  // await oktoClient.auth.loginUsingOAuth({
  //   idToken:
  //     'eyJhbGciOiJSUzI1NiIsImtpZCI6IjYzMzdiZTYzNjRmMzgyNDAwOGQwZTkwMDNmNTBiYjZiNDNkNWE5YzYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE4MTI5MjU3NTAxMDQ1MzA2NDUiLCJlbWFpbCI6InBhcm1pbmRlcnNpbmdob3V0bGluZXN5c3RlbXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJWT2xtLVZGVWlsRWZFMEtVSWFBeUJ3IiwibmFtZSI6IlBhcm1pbmRlciBTaW5naCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKZklwOVhNaUZJTElWSUE2MXZBQnRNODROQ0FISE5DaUd3VjhXY2lqa1pueWNOeUE9czk2LWMiLCJnaXZlbl9uYW1lIjoiUGFybWluZGVyIiwiZmFtaWx5X25hbWUiOiJTaW5naCIsImlhdCI6MTczNzg4MTU4MywiZXhwIjoxNzM3ODg1MTgzfQ.KF35GZNtE-E8kW7edBOXSc7DrLfzeDcXHFzkwx6HnTSeBhDXoQ4AV1kdSs1s_oOSei3eNFZdVswqSiYwlOCNV7Lu6JTUXeSHug2ahmwMmjBvbwfWrOxztV3621GLwFHn-mJ6mhksgNkujNBeMlURuNqrRQ9JRfAbGB-_bw7usNB2glcus4-DSqG-5b2Prr5zGahi9rgSmH704AKtmO_1OMsrRRd5lmvi4NsY6y6h6lrmcRHUscLbk6QJUW8048tbJLlhaMSF2Pv1DtQTxFxSkPlBtcqz1QmcbsZtaAsTbG0HgyBPyOW5gO6mKZrsBdd1AhJc9ojWLug0VrEOkLCBEg',
  //   provider: 'google',
  // });
  // const chain = useChain();
  // const token = useToken();
  // const account = useAccount();
  const auth = useAuth();


  try {
    // Use the auth methods
    const loginResponse = auth.user;

    // console.log('Login Response:', loginResponse);
  } catch (error) {
    console.error('Login failed:', error);
  }
}
  // console.log(`Karan in src ${oktoClient.account.getAccount()}`);
//   // console.log(
//   //   `karan is here for getorderhistory ${await oktoClient.account.getOrdersHistory()}`,
//   // );

//   // console.log(
//   //   `karan is here for getUserPortfolio NFT ${await oktoClient.account.getPortfolioActivity()}`,
//   // );

//   const transferData = {
//     chain: 'POLYGON',
//     recipient: '0xDD84c0c4A4120521ebC9f007Bc104A5CA4837465',
//     token: '0x9ccC175B2f198C566809C87FD4585c6D6e2B1018',
//     amount: 1,
//   };

// //   console.log(
// //     `karan is here for getaccount  ${oktoClient.account.getAccount()}`,
// //   );
//   const userOP = await oktoClient.userOperation.tokenTransfer(transferData);


//   console.log(`karan is here for user OP generation ${userOP}`);

//   console.log(
//     `karan is here in signing ${oktoClient.account.signUserOp(userOP)}`,
//   );
// // estimate

//   console.log(
//     `karan is here in execute  ${oktoClient.account.executeUserOp(userOP)}`,
//   );

//   const estimateData = {
//     recipientWalletAddress: '0xDD84c0c4A4120521ebC9f007Bc104A5CA4837465',
//     networkId: '62311d9f-155b-3514-95a9-0894d00e054d',
//     tokenAddress: '0x9ccC175B2f198C566809C87FD4585c6D6e2B1018',
//     amount: '1',
//   };

//   // Destructure estimateData to pass the arguments individually
//   // console.log(
//   //   `karan is here in estimate ${await oktoClient.account.estimate(
//   //     estimateData.recipientWalletAddress,
//   //     estimateData.networkId,
//   //     estimateData.tokenAddress,
//   //     estimateData.amount,
//   //   )}`,
//   // );

main();

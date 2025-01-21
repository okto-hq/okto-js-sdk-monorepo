import { OktoClient } from '@okto-sdk/core-js';
async function main() {
  const oktoClient = new OktoClient({
    environment: 'sandbox',
    vendorPrivKey:
      '0xadf2181a7b2dec0f1ed22061ab31bd6182691c619d9e874a956e71ab7ecca413',
    vendorSWA: '0x6b6Fad2600Bc57075ee560A6fdF362FfefB9dC3C',
  });
  await oktoClient.auth.loginUsingOAuth({
    idToken:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRkMTI1ZDVmNDYyZmJjNjAxNGFlZGFiODFkZGYzYmNlZGFiNzA4NDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE4MTI5MjU3NTAxMDQ1MzA2NDUiLCJlbWFpbCI6InBhcm1pbmRlcnNpbmdob3V0bGluZXN5c3RlbXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJlR2RteDhXcVp6eE02ZEZ1dVhnNS1nIiwibmFtZSI6IlBhcm1pbmRlciBTaW5naCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKZklwOVhNaUZJTElWSUE2MXZBQnRNODROQ0FISE5DaUd3VjhXY2lqa1pueWNOeUE9czk2LWMiLCJnaXZlbl9uYW1lIjoiUGFybWluZGVyIiwiZmFtaWx5X25hbWUiOiJTaW5naCIsImlhdCI6MTczNzQ1NTYyMiwiZXhwIjoxNzM3NDU5MjIyfQ.JK59ranq6nuUvvH3xuVMTxwB17Msf0e8thTrCaeQQtluVxBLltYUu-Pk8oPDZPjJJPVSX6BizZNlCKDD0UAxW1TDtG_bE_PZV3W009x4g1YyZdWBplw4_Ev5yuy4xk3pHYqyg0-fbeNYnsDDMt0z3S8PTu0Zbo6dVPU5wxOA1zR9DUtGqQHTUKhheYHRUm0O2eM_z--5o746d3cEIn21mmjlz2JeZidBYdomhWHCbtHHeP3nY4UJ8etQ2EmQpAanyysQ-IM7ENvjzQ7oJus6CgrzJp7nxyNzEWqXl1ACSLLyw-hPXK00YoXoYuM_ayhA1WsGXlnpb_lgdK3PKPPCfw',
    provider: 'google',
  });
  // console.log(oktoClient.auth);
  // console.log(`Karan in src ${oktoClient.account.getAccount()}`);
  // console.log(
  //   `karan is here for getorderhistory ${await oktoClient.account.getOrdersHistory()}`,
  // );

  console.log(
    `karan is here for getUserPortfolio NFT ${await oktoClient.account.getPortfolioActivity()}`,
  );

  console.log(
    `karan is here for getUserPortfolio NFT ${await oktoClient.account.getOrdersHistory()}`,
  );


}
main();

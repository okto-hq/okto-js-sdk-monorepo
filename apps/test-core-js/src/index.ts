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
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRkMTI1ZDVmNDYyZmJjNjAxNGFlZGFiODFkZGYzYmNlZGFiNzA4NDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTE4MTI5MjU3NTAxMDQ1MzA2NDUiLCJlbWFpbCI6InBhcm1pbmRlcnNpbmdob3V0bGluZXN5c3RlbXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ4LWxWTXRfQnRvUTZVRzIxYTI0aW5RIiwibmFtZSI6IlBhcm1pbmRlciBTaW5naCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKZklwOVhNaUZJTElWSUE2MXZBQnRNODROQ0FISE5DaUd3VjhXY2lqa1pueWNOeUE9czk2LWMiLCJnaXZlbl9uYW1lIjoiUGFybWluZGVyIiwiZmFtaWx5X25hbWUiOiJTaW5naCIsImlhdCI6MTczNzQ0MTE4MCwiZXhwIjoxNzM3NDQ0NzgwfQ.E7T7-dL65Dbn3SABOZRFAsh5RBG4UCzm2gcEbHw5f5JrgFm43FCMhDb3j2qNNW4c7rTJvlDVwbQLPs6ggISl3XnxB5QHl94A35gfXNQq7maimsdiUu6CjNWQUVkkynM5ZValt6ekWKkFzVpBCvqRLCQk809gX1OQgUbsGEIujzhapqK5IiJM1orJQRe4S9OyXClAKfIwxdhsjWOoGw_QjDu0NTsAbL0vx3Be7IeD-wIxyzbDa0P0CQezOdq_g1Mx9MGcLxyYiO6UAr6oI98ePR2Nvw33u79zAwk5-FDQsx0Ct395zokfpmUB9NLJD-EVcvRfrARaoHRdZ1cdkVZ8hw',
    provider: 'google',
  });
  // console.log(oktoClient.auth);
  console.log(`Karan in src ${oktoClient.auth.user?.userAddress}`);
  console.log(`karan is here ${await oktoClient.chain.getChains()}`);
}
main();

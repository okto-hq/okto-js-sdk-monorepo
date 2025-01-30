import { OktoClient } from "@okto_web3/core-js-sdk";
import { getOrdersHistory } from "@okto_web3/core-js-sdk/explorer";

async function main() {
  console.log('Hello, Okto!');

   const oclient = new OktoClient({
     environment: "sandbox",
     vendorPrivKey: "0xadf2181a7b2dec0f1ed22061ab31bd6182691c619d9e874a956e71ab7ecca413",
     vendorSWA: "0x6b6Fad2600Bc57075ee560A6fdF362FfefB9dC3C",
   });


   await oclient.loginUsingOAuth({
     idToken:
       'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZhMDcyZjc1Nzg0NjQyNjE1MDg3YzcxODJjMTAxMzQxZTE4ZjdhM2EiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDQwNDAxODg3NjczNzI2Mzk0MTEiLCJoZCI6ImNoaXRrYXJhLmVkdS5pbiIsImVtYWlsIjoic3JpamFuMTM4NC5iZTIxQGNoaXRrYXJhLmVkdS5pbiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoidVU2dkUyc0pvcDFLSHBydWJuYjRJUSIsIm5hbWUiOiJTcmlqYW4gU2FtcmlkaCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKSDdZVUxhS2ZpWk5ISzJ5MWJTeWN2VlR3ejgxVDNWSmttcDQzQWJZRUlnekRRbkRUVz1zOTYtYyIsImdpdmVuX25hbWUiOiJTcmlqYW4iLCJmYW1pbHlfbmFtZSI6IlNhbXJpZGgiLCJpYXQiOjE3MzgyNTA2MDcsImV4cCI6MTczODI1NDIwN30.E_XNZ05DASkq32xhrJQsf2DrWIuQWW_2CAitg5CS2EvPwYHV3dBK1-4KlZwPavnJqUDFDiq0I8nYA4eK9DU1ce1ay3sHq9ypW2hgganxkVawcOHYUHTQzskhkN-hr_Tht8GXpqMvSCBOUOQgR8wN4a6hgj8L9ITD5D8x3EKryS59Nx0ZEpPTLe4A9j4-oDKyJcDyYBDwCZLTS_B-3PHZhDuuW1arursEKFlFPi4odE9QPKGtDWV2tZAh7rOy3_-gErauNwKWmK8psl5YxYLEJcvpcga6IrrCVtZ2i4NNvdimXrI_nlATU9ddhVJWAOvKCEaKcnyAOqOR5KXdNtSKlg',
     provider: 'google',
   });

   try {
     const orders = await getOrdersHistory(oclient, {
       intentId: '0deff026-0261-06ad-0000-000000000000',
     });
     console.log('Orders:', orders);
   } catch (error) {
     console.error('Error fetching orders:', error);
   }
}



main();

export const INTENT_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_jobId',
        type: 'uint256',
      },
      {
        name: '_clientSWA',
        type: 'address',
      },
      {
        name: '_userSWA',
        type: 'address',
      },
      {
        name: '_feePayerAddress',
        type: 'address',
      },
      {
        name: '_policyInfo',
        type: 'bytes',
      },
      {
        name: '_gsnData',
        type: 'bytes',
      },
      {
        name: '_jobParameters',
        type: 'bytes',
      },
      {
        name: '_intentType',
        type: 'string',
      },
    ],
    name: 'initiateJob',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

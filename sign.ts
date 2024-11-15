import "dotenv/config";
import {
    SignProtocolClient,
    SpMode,
    EvmChains,
    IndexService,
    decodeOnChainData,
    DataLocationOnChain,
    delegateSignAttestation
    // delegateSignAttestation,
    // delegateSignRevokeAttestation,
    // delegateSignSchema,
  } from "@ethsign/sp-sdk";
  import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
  const admin = process.env.WALLET!; // Optional
  const indexService = new IndexService("testnet");
    
  const chainId = 84532

  const eoa = privateKeyToAccount(generatePrivateKey());
  const owner = privateKeyToAccount(generatePrivateKey());

  const client = new SignProtocolClient(SpMode.OnChain, {
    chain: EvmChains.baseSepolia,
    account: privateKeyToAccount(admin as `0x${string}`), // Optional if you are using an injected provider
  });

  async function main() { 
    console.log(generatePrivateKey())
    // Create schema
  // const createSchemaRes = await client.createSchema({
  //   name: "approval",
  //   data: [{ name: "nft_id", type: "string" }],
  // });
  // console.log(createSchemaRes);

  const schema = {
    schemaId: '0x412',
    txHash: '0x63a9018170ba53890583d655babaf04e1da4fa99240fd669a88d4e7e83645dc6'
  }


  const info = await delegateSignAttestation(
    {
      schemaId: schema.schemaId,
      data: { nft_id: "*" },
      recipients: [eoa.address],
      indexingValue: `connect:${owner.address}:${eoa.address}`,
    },
    {
      chain: EvmChains.baseSepolia,
      delegationAccount: owner,
    }
  );

  const delegationCreateAttestationRes = await client.createAttestation(
    info.attestation,
    {
      delegationSignature: info.delegationSignature,
    }
  );
  console.log(delegationCreateAttestationRes);
  // {
  //   attestationId: '0xb74',
  //   txHash: '0xe6b26738f8cf6f5de0b381773dd07e7ca2eaab8cbc7bc9927b316d56a9c607c7',
  //   indexingValue: '0x877E70E5f88cCF78CcC7D49871B5cA68eD042E780xA0474ceF0bb91415DbE27108b2539D68f4DFD1D2'
  // }

  // client.getAttestation
  // const attestation = await client.getAttestation(schema.schemaId, schema.txHash)


  // const res = await indexService.queryAttestationList({
  //   schemaId: `onchain_evm_${chainId}_${schema.schemaId}`, // Your full schema's ID
  //   // attester: sender.address, // Alice's address
  //   page: 1,
  //   mode: "onchain", // Data storage location
  //   // indexingValue: recipient.address.toLowerCase(), // Bob's address
  // });

  // const decoded = decodeOnChainData(res?.rows[0].data, DataLocationOnChain.ONCHAIN, [{name: "nft_id", type: "string"}])

  // console.log(decoded)
}
  

main()
//   // Delegated create schema
//   const delegationPrivateKey = "0xaaaaa";
//   const info = await delegateSignSchema(
//     {
//       name: "xxx",
//       data: [{ name: "name", type: "string" }],
//     },
//     {
//       chain: EvmChains.polygonMumbai,
//       delegationAccount: privateKeyToAccount(delegationPrivateKey),
//     }
//   );
//   const delegateCreateSchemaRes = await client.createSchema(info.schema, {
//     delegationSignature: info.delegationSignature,
//   });
  
//   // Create attestation
//   const createAttestationRes = await client.createAttestation({
//     schemaId: "0x3",
//     data: { name: "a" },
//     indexingValue: "xxx",
//   });
  
//   // Delegated create attestation
//   const delegationPrivateKey = "0xaaaaa";
  
//   const delegationCreateAttestationRes = await client.createAttestation(
//     info.attestation,
//     {
//       delegationSignature: info.delegationSignature,
//     }
//   );
  
//   // Revoke attestation
//   const revokeAttestationRes = await client.revokeAttestation("0x3", {
//     reason: "test",
//   });
  
//   // Delegated revoke attestation
//   const delegationPrivateKey = "0xaaaaa";
//   const info = await delegateSignRevokeAttestation(attestationId, {
//     chain: EvmChains.polygonMumbai,
//     reason: "test",
//     delegationAccount: privateKeyToAccount(delegationPrivateKey),
//   });
//   const delegationRevokeAttestationRes = await client.revokeAttestation(
//     info.attestationId,
//     {
//       reason: info.reason,
//       delegationSignature: info.delegationSignature,
//     }
//   );
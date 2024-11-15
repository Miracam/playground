import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethersv5";
import { LIT_RPC, LitNetwork } from "@lit-protocol/constants";
import { AccessControlConditions, AuthCallback } from "@lit-protocol/types";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import {
    createSiweMessageWithRecaps,
    AuthSig,
    createSiweMessage,
    generateAuthSig,
    LitAbility,
    LitAccessControlConditionResource,
    LitActionResource,
} from "@lit-protocol/auth-helpers";

export const litNetwork = LitNetwork.DatilTest;
export const chain = "ethereum";
export const litRpc = LIT_RPC.CHRONICLE_YELLOWSTONE;

function getAccessControlConditions(owner: string) {

    // const accessControlConditions: AccessControlConditions = [
    //   {
    //     "contractAddress": "",
    //     "standardContractType": "",
    //     "chain": "ethereum",
    //     "method": "",
    //     "parameters": [ "9541" ],
    //     "returnValueTest": { "comparator": "=", "value": "9541" }
    //   }
    // ]



    const accessControlConditions: AccessControlConditions = [
        {
            contractAddress: "ipfs://QmXpq4g4qynf423bhbFqmpCDBfbCRSVxnVcPy1ArCxLHsj",
            standardContractType: "LitAction",
            chain,
            method: "go",
            parameters: [":userAddress", owner],
            returnValueTest: {
                comparator: "=",
                value: "true",
            },
        },
    ];
    return accessControlConditions
}

class Lit {

    litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
        alertWhenUnauthorized: true,
        litNetwork,
        debug: false,
    });
    provider = new ethers.providers.JsonRpcProvider(litRpc);


    constructor() {
    }

    async delegate(delegater: ethers.Wallet, delegateeAddress: string, capacityTokenId: number) {
        const { capacityDelegationAuthSig } =
            await this.litNodeClient.createCapacityDelegationAuthSig({
                dAppOwnerWallet: delegater,
                capacityTokenId: capacityTokenId.toString(),
                delegateeAddresses: [delegateeAddress],
                // uses: "1",
                // expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 1 minute
            });
        return capacityDelegationAuthSig;
    }

    balance(wallet: string) {
        return this.provider.getBalance(wallet);
    }

    async connect() {
        await this.litNodeClient.connect();
    }

    async disconnect() {
        await this.litNodeClient.disconnect();
    }

    async getSessionSignatures(wallet: ethers.Wallet, capacityDelegationAuthSig?: AuthSig) {

        // Get the latest blockhash
        const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

        // Define the authNeededCallback function
        const authNeededCallback: AuthCallback = async (params) => {
            if (!params.uri) {
                throw new Error("uri is required");
            }
            if (!params.expiration) {
                throw new Error("expiration is required");
            }

            if (!params.resourceAbilityRequests) {
                throw new Error("resourceAbilityRequests is required");
            }

            console.log(params)

            // Create the SIWE message
            const toSign = await createSiweMessageWithRecaps({
                uri: params.uri,
                expiration: params.expiration,
                resources: params.resourceAbilityRequests,
                walletAddress: wallet.address,
                nonce: latestBlockhash,
                litNodeClient: this.litNodeClient,
            });

            // Generate the authSig
            const authSig = await generateAuthSig({
                signer: wallet,
                toSign,
            });

            return authSig;
        }

        // Define the Lit resource
        const litResource = new LitAccessControlConditionResource('*');

        // Get the session signatures
        const sessionSigs = await this.litNodeClient.getSessionSigs({
            chain,
            resourceAbilityRequests: [
                {
                    resource: litResource,
                    ability: LitAbility.AccessControlConditionDecryption,
                },
            ],
            authNeededCallback,
            // capacityDelegationAuthSig,
        });
        return sessionSigs;
    }


    async mintCapacityDelegationAuthSig(wallet: ethers.Wallet) {

        const contractClient = new LitContracts({
            signer: wallet,
            network: litNetwork,
        });
        await contractClient.connect();
        const { capacityTokenIdStr } = await contractClient.mintCapacityCreditsNFT({
            // requestsPerKilosecond: 80,
            requestsPerDay: 14400,
            requestsPerSecond: 100,
            daysUntilUTCMidnightExpiration: 30,
        });
        return capacityTokenIdStr;
    }

    async getAuthSig(wallet: ethers.Wallet) {
        // put your private key into this env var
        const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

        const litResource = new LitAccessControlConditionResource("*");

        // const toSign = await createSiweMessage({
        //   uri: `http://localhost:3000`,
        //   // expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
        //   resources: [
        //     {
        //       resource: litResource,
        //       ability: LitAbility.AccessControlConditionDecryption,
        //     },
        //   ],
        //   walletAddress: this.wallet.address,
        //   nonce: latestBlockhash,
        //   litNodeClient: this.litNodeClient,
        // });

        const toSign = await createSiweMessageWithRecaps({
            uri: `http://localhost:3000`,
            expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            resources: [
                {
                    resource: litResource,
                    ability: LitAbility.AccessControlConditionDecryption,
                },
            ],
            walletAddress: wallet.address,
            nonce: latestBlockhash,
            litNodeClient: this.litNodeClient,
        });

        // Generate the authSig
        const authSig = await generateAuthSig({
            signer: wallet,
            toSign,
        });

        return authSig;
    }

    async encrypt(message: string, owner: ethers.Wallet) {
        // Encrypt the message
        const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
            {
                accessControlConditions: getAccessControlConditions(owner.address),
                dataToEncrypt: message,
            },
            this.litNodeClient,
        );

        // Return the ciphertext and dataToEncryptHash
        return {
            ciphertext,
            dataToEncryptHash,
        };
    }

    // async getSessionSignatures(capacityDelegationAuthSig?: AuthSig) {
    //  // Get the latest blockhash
    //  const latestBlockhash = await this.litNodeClient.getLatestBlockhash();

    //  // Define the authNeededCallback function
    //  const authNeededCallback: AuthCallback = async (params) => {
    //    if (!params.uri) {
    //      throw new Error("uri is required");
    //    }
    //    if (!params.expiration) {
    //      throw new Error("expiration is required");
    //    }

    //    if (!params.resourceAbilityRequests) {
    //      throw new Error("resourceAbilityRequests is required");
    //    }

    //    // Create the SIWE message
    //    const toSign = await createSiweMessageWithRecaps({
    //      uri: params.uri,
    //      expiration: params.expiration,
    //      resources: params.resourceAbilityRequests,
    //      walletAddress: this.wallet.address,
    //      nonce: latestBlockhash,
    //      litNodeClient: this.litNodeClient,
    //    });

    //    // Generate the authSig
    //    const authSig = await generateAuthSig({
    //      signer: this.wallet,
    //      toSign,
    //    });

    //    return authSig;
    //  };

    //  // Define the Lit resource
    //  const litResource = new LitAccessControlConditionResource("*");

    //  // Get the session signatures
    //  const sessionSigs = await this.litNodeClient.getSessionSigs({
    //    chain: this.chain,
    //    resourceAbilityRequests: [
    //      {
    //        resource: litResource,
    //        ability: LitAbility.AccessControlConditionDecryption,
    //      },
    //    ],
    //    authNeededCallback,
    //    capabilityAuthSigs: capacityDelegationAuthSig && [capacityDelegationAuthSig],
    //  });
    //  return sessionSigs;
    // }

    async decrypt(ciphertext: string, dataToEncryptHash: string, eoa: ethers.Wallet, owner: string, capacityDelegationAuthSig?: AuthSig) {

        // Decrypt the message
        const decryptedString = await LitJsSdk.decryptToString(
            {
                accessControlConditions: getAccessControlConditions(owner),
                chain,
                ciphertext,
                dataToEncryptHash,
                // sessionSigs: await this.getSessionSignatures(wallet, capacityDelegationAuthSig),
                authSig: await this.getAuthSig(eoa),
            },
            this.litNodeClient,
        );

        // Return the decrypted string
        return { decryptedString };
    }
}

export default Lit;

async function test() {
    const lit = new Lit();
    await lit.connect();
    const eoa = ethers.Wallet.createRandom();
    const owner = ethers.Wallet.createRandom();
    const { ciphertext, dataToEncryptHash } = await lit.encrypt("hello", owner);
    // console.log(ciphertext, dataToEncryptHash);
    const decryptedString = await lit.decrypt(ciphertext, dataToEncryptHash, eoa, owner.address);
    console.log(decryptedString);
    // const authSig = await lit.getAuthSig(wallet);
    // console.log(authSig);
    await lit.disconnect();
}

test().catch(console.error);
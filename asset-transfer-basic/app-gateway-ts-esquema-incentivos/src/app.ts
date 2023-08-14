import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));

// Path to user certificate.
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');



const utf8Decoder = new TextDecoder();



async function main(): Promise<void> {
    console.log("Inicia main --- app gateway typescript esquema incentivos...");

    await displayInputParameters();

    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });


    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        await createChallenge(contract);

        await createRecordTXN(contract);

        await GetAllRanking(contract);

        await GetAllChallenges(contract);

    } finally {
        gateway.close();
        client.close();
    }
}

main().catch(error => {
    console.error('******** FAILED to run the application app-gateway-ts-esquema-incentivos: ', error);
    process.exitCode = 1;
});




/*
FUNCIÓN PARA CREAR UN REGISTRO DE UN CANAL QUE HA COMPLETO UN DESÁFIO.
*/
async function createRecordTXN(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: createRecordTXN, creates new asset with IdDesafio and idCanal arguments');

    await contract.submitTransaction(
        'createRecordTXN',
        '102',
        'desafio-1',
    );

    console.log('*** Transaction committed successfully');
}


async function createChallenge(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: createChallenge, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');

    await contract.submitTransaction(
        'createChallenge',
        `desafio-1`,
        'desafío test 001',
        'descripcion 001',
        '5 tokens'
    );

    console.log('*** Transaction committed successfully');
}


async function GetAllRanking(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: GetAllRanking, function returns all the current ranking on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetRecordByDocType', 'txnRanking');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Ranking: ----\n', result);
}


async function GetAllChallenges(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: GetAllChallenges, function returns all the current challenges on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetRecordByDocType', 'txnChallenge');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Desafiós: ----\n', result);
}









/*
Métodos para conectarse a la red.
*/

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner(): Promise<Signer> {
    const files = await fs.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}



/**
* envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
*/
function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

async function displayInputParameters(): Promise<void> {
    console.log(`\nChannelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certPath:          ${certPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}\n`);
}
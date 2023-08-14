'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class MainTransfer extends Contract {

    async InitLedger(ctx) {

        console.log("Log para validar que el main transfer ah sido desplegado en la red......");
        console.log("Log SEGUNDO LOG PARA VALIDAR SI EL UPDATE DEL SMART CONTRACT FUNCIONA......");

        const assets = [
            {
                ID: 'asset1',
                Color: 'blue',
                Size: 5,
                Owner: 'Tomoko',
                AppraisedValue: 300,
            },
            {
                ID: 'asset2',
                Color: 'red',
                Size: 5,
                Owner: 'Brad',
                AppraisedValue: 400,
            },
            {
                ID: 'asset3',
                Color: 'green',
                Size: 10,
                Owner: 'Jin Soo',
                AppraisedValue: 500,
            },
            {
                ID: 'asset4',
                Color: 'yellow',
                Size: 10,
                Owner: 'Max',
                AppraisedValue: 600,
            },
            {
                ID: 'asset5',
                Color: 'black',
                Size: 15,
                Owner: 'Adriana',
                AppraisedValue: 700,
            },
            {
                ID: 'asset6',
                Color: 'white',
                Size: 15,
                Owner: 'Michel',
                AppraisedValue: 800,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    async createRecordTXN(ctx, idCanal, idDesafio) {
        console.log("Log para validar que el main transfer ah sido desplegado en la red......");
        console.log("\nLLego una petición para crear un registro al ranking");
        console.log(`Datos -- idCanal: ${idCanal} idDesafio: ${idDesafio}\n`);

        const exists = await this.desafioExists(ctx, idDesafio);
        if (!exists) {
            throw new Error(`El desafío con id: ${idDesafio} no existe..`);
        }

        var idRegister = idDesafio + '-' + idCanal;
        const registro = {
            ID: idRegister,
            idDesafio: idDesafio,
            idCanal: idCanal,
            docType: 'txnRanking'
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(idRegister, Buffer.from(stringify(sortKeysRecursive(registro))));
        return JSON.stringify(registro);
    }



    async GetAllRanking(ctx) {
        console.log("Log para validar que el main transfer ah sido desplegado en la red......");
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                if (record.docType && record.docType === "txnRanking") {
                    allResults.push(record);
                }
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}


module.exports = MainTransfer;
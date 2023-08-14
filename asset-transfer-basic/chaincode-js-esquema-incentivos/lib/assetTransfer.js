'use strict';

// Deterministic JSON.stringify()
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async createRecordTXN(ctx, idCanal, idDesafio) {
        console.log("\nLLego una petición para crear un registro al ranking");
        console.log(`Datos: -- idCanal: ${idCanal} idDesafio: ${idDesafio}\n`);

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

    async GetRecordByDocType(ctx, paramDocType) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                if (record.docType && record.docType === paramDocType) {
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


module.exports = AssetTransfer;
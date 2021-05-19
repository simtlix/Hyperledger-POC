/*
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto = require('crypto');
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Employees } from './employees';

async function getCollectionName(ctx: Context): Promise<string> {
    const mspid: string = ctx.clientIdentity.getMSPID();
    const collectionName: string = `_implicit_org_${mspid}`;
    return collectionName;
}

@Info({title: 'EmployeesContract', description: 'My Private Data Smart Contract' })
export class EmployeesContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async employeesExists(ctx: Context, employeesId: string): Promise<boolean> {
        const collectionName: string = await getCollectionName(ctx);
        const data: Uint8Array = await ctx.stub.getPrivateDataHash(collectionName, employeesId);
        return (!!data && data.length > 0);
    }

    @Transaction()
    public async createEmployees(ctx: Context, employeesId: string): Promise<void> {
        const exists: boolean = await this.employeesExists(ctx, employeesId);
        if (exists) {
            throw new Error(`The asset employees ${employeesId} already exists`);
        }

        const privateAsset: Employees = new Employees();

        const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
        
        if (transientData.size === 0) {
            throw new Error('Was not specified transient data. Please try again.');
        }

        if (!transientData.has('name')) {
            throw new Error('The name key was not specified in transient data. Please try again.');
        }
        privateAsset.name = transientData.get('name').toString();

        if (!transientData.has('surname')) {
            throw new Error('The surname key was not specified in transient data. Please try again.');
        }
        privateAsset.surname = transientData.get('surname').toString();

        if (!transientData.has('dni')) {
            throw new Error('The dni key was not specified in transient data. Please try again.');
        }
        privateAsset.dni = Number(transientData.get('dni'));

        if (!transientData.has('hiringDate')) {
            throw new Error('The hiringDate key was not specified in transient data. Please try again.');
        }
        privateAsset.hiringDate = transientData.get('hiringDate').toString();

        const collectionName: string = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, employeesId, Buffer.from(JSON.stringify(privateAsset)));
    }

    @Transaction(false)
    @Returns('Employees')
    public async readEmployees(ctx: Context, employeesId: string): Promise<string> {
        const exists: boolean = await this.employeesExists(ctx, employeesId);
        if (!exists) {
            throw new Error(`The asset employees ${employeesId} does not exist`);
        }

        let privateDataString: string;

        const collectionName: string = await getCollectionName(ctx);
        const privateData: Uint8Array = await ctx.stub.getPrivateData(collectionName, employeesId);

        privateDataString = JSON.parse(privateData.toString());
        return privateDataString;
    }

    @Transaction()
    public async updateEmployees(ctx: Context, employeesId: string): Promise<void> {
        const exists: boolean = await this.employeesExists(ctx, employeesId);
        if (!exists) {
            throw new Error(`The asset employees ${employeesId} does not exist`);
        }

        const privateAsset: Employees = new Employees();

        const transientData: Map<string, Uint8Array> = ctx.stub.getTransient();
        
        if (transientData.size === 0) {
            throw new Error('Was not specified transient data. Please try again.');
        }

        if (!transientData.has('name')) {
            throw new Error('The name key was not specified in transient data. Please try again.');
        }
        privateAsset.name = transientData.get('name').toString();

        if (!transientData.has('surname')) {
            throw new Error('The surname key was not specified in transient data. Please try again.');
        }
        privateAsset.surname = transientData.get('surname').toString();

        if (!transientData.has('dni')) {
            throw new Error('The dni key was not specified in transient data. Please try again.');
        }
        privateAsset.dni = Number(transientData.get('dni'));

        if (!transientData.has('hiringDate')) {
            throw new Error('The hiringDate key was not specified in transient data. Please try again.');
        }
        privateAsset.hiringDate = transientData.get('hiringDate').toString();

        const collectionName: string = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, employeesId, Buffer.from(JSON.stringify(privateAsset)));
    }

    @Transaction()
    public async deleteEmployees(ctx: Context, employeesId: string): Promise<void> {
        const exists: boolean = await this.employeesExists(ctx, employeesId);
        if (!exists) {
            throw new Error(`The asset employees ${employeesId} does not exist`);
        }

        const collectionName: string = await getCollectionName(ctx);
        await ctx.stub.deletePrivateData(collectionName, employeesId);
    }

    @Transaction()
    public async verifyEmployees(ctx: Context, mspid: string, employeesId: string, objectToVerify: Employees): Promise<boolean> {
        // Convert user provided object into a hash
        const hashToVerify: string = crypto.createHash('sha256').update(JSON.stringify(objectToVerify)).digest('hex');
        const pdHashBytes: Uint8Array = await ctx.stub.getPrivateDataHash(`_implicit_org_${mspid}`, employeesId);
        if (pdHashBytes.length === 0) {
            throw new Error(`No private data hash with the Key: ${employeesId}`);
        }

        const actualHash: string = Buffer.from(pdHashBytes).toString('hex');

        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        if (hashToVerify === actualHash) {
            return true;
        } else {
            return false;
        }
    }

}

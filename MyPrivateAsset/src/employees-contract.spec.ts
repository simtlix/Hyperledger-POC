/*
 * SPDX-License-Identifier: Apache-2.0
 */

 // tslint:disable: no-unused-expression
import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { EmployeesContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import crypto = require('crypto');
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logger = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
    };
}

describe('EmployeesContract', () => {

    let contract: EmployeesContract;
    let ctx: TestContext;
    const mspid = 'one';
    const collectionName = `_implicit_org_${mspid}`;

    beforeEach(() => {
        contract = new EmployeesContract();
        ctx = new TestContext();
        ctx.clientIdentity.getMSPID.returns(mspid);
        ctx.stub.getPrivateData.withArgs(collectionName, '001').resolves(Buffer.from('{"privateValue":"150"}'));
        const hashToVerify = crypto.createHash('sha256').update('{"privateValue":"150"}').digest('hex');
        ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from(hashToVerify, 'hex'));
    });

    describe('#employeesExists', () => {

        it('should return true for a employees', async () => {
            await contract.employeesExists(ctx, '001').should.eventually.be.true;
        });

        it('should return false for a employees that does not exist', async () => {
            await contract.employeesExists(ctx, '003').should.eventually.be.false;
        });
    });

    describe('#createEmployees', () => {

        it('should throw an error for a employees that already exists', async () => {
            await contract.createEmployees(ctx, '001').should.be.rejectedWith(/The asset employees 001 already exists/);
        });

        it('should throw an error if transient data is not provided when creating a employees', async () => {
            const transientMap: Map<string, Buffer> = new Map<string, Buffer>();
            ctx.stub.getTransient.returns(transientMap);
            await contract.createEmployees(ctx, '002').should.be.rejectedWith(`The privateValue key was not specified in transient data. Please try again.`);
        });

        it('should throw an error if transient data key is not privateValue', async () => {
            const transientMap: Map<string, Buffer> = new Map<string, Buffer>();
            transientMap.set('prVal', Buffer.from('125'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.createEmployees(ctx, '002').should.be.rejectedWith(`The privateValue key was not specified in transient data. Please try again.`);
        });

        it('should create a employees if transient data key is privateValue', async () => {
            const transientMap: Map<string, Buffer> = new Map<string, Buffer>();
            transientMap.set('privateValue', Buffer.from('1500'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.createEmployees(ctx, '002');
            ctx.stub.putPrivateData.should.have.been.calledOnceWithExactly(collectionName, '002', Buffer.from('{"privateValue":"1500"}'));
        });
    });

    describe('#readPrivateEmployees', () => {

        it('should throw an error for a employees that does not exist', async () => {
            await contract.readEmployees(ctx, '003').should.be.rejectedWith(/The asset employees 003 does not exist/);
        });

        it('should return a employees', async () => {
            await contract.readEmployees(ctx, '001').should.eventually.deep.equal({ privateValue: '150' });
            ctx.stub.getPrivateData.should.have.been.calledWithExactly(collectionName, '001');
        });
    });

    describe('#updateEmployees', () => {

        it('should throw an error for a employees that does not exist', async () => {
            await contract.updateEmployees(ctx, '003').should.be.rejectedWith(/The asset employees 003 does not exist/);
        });

        it('should throw an error if transient data is not provided when updating a employees', async () => {
            const transientMap: Map<string, Buffer> = new Map<string, Buffer>();
            ctx.stub.getTransient.returns(transientMap);
            await contract.updateEmployees(ctx, '001').should.be.rejectedWith(`The privateValue key was not specified in transient data. Please try again.`);
        });

        it('should update my private asset if transient data key is privateValue', async () => {
            const transientMap: Map<string, Buffer> = new Map<string, Buffer>();
            transientMap.set('privateValue', Buffer.from('99'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.updateEmployees(ctx, '001');
            ctx.stub.putPrivateData.should.have.been.calledOnceWithExactly(collectionName, '001', Buffer.from('{"privateValue":"99"}'));
        });

        it('should throw an error if transient data key is not privateValue', async () => {
            const transientMap: Map<string, Buffer> = new Map<string, Buffer>();
            transientMap.set('prVal', Buffer.from('125'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.updateEmployees(ctx, '001').should.be.rejectedWith(`The privateValue key was not specified in transient data. Please try again.`);
        });
    });

    describe('#deleteEmployees', () => {

        it('should throw an error for a employees that does not exist', async () => {
            await contract.deleteEmployees(ctx, '003').should.be.rejectedWith(/The asset employees 003 does not exist/);
        });

        it('should delete a employees', async () => {
            await contract.deleteEmployees(ctx, '001');
            ctx.stub.deletePrivateData.should.have.been.calledOnceWithExactly(collectionName, '001');
        });
    });

    describe('#verifyEmployees', () => {

        it('should return true if hash calculated from object provided matches the hash of the private data', async () => {
            const privateObj: string = '{"privateValue":"125"}';
            const hashToVerify: string = crypto.createHash('sha256').update(privateObj).digest('hex');
            ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from(hashToVerify, 'hex'));
            const result: boolean = await contract.verifyEmployees(ctx, mspid, '001', {privateValue: '125'});
            result.should.equal(true);
        });

        it('should return false if hash calculated from object provided does not match the hash of the private data', async () => {
            ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from('someHash'));
            const result: boolean = await contract.verifyEmployees(ctx, mspid, '001', {privateValue: 'someValue'});
            result.should.equal(false);
        });

        it('should throw an error when user tries to verify an asset that doesnt exist', async () => {
            ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from(''));
            await contract.verifyEmployees(ctx, mspid, '001', {privateValue: 'someValue'}).should.be.rejectedWith('No private data hash with the Key: 001');
        });
    });
});

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Employees {

    @Property()
    public surname: string;

    @Property()
    public name: string;

    @Property()
    public dni: number;

    @Property()
    public hiringDate: string;
}

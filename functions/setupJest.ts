// tslint:disable-next-line: no-import-side-effect
import 'jest';

const fetch = require('jest-fetch-mock');

jest.setMock('node-fetch', fetch);

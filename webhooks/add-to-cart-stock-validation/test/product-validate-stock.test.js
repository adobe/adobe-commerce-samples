/*
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
    Core: {
        Logger: jest.fn()
    }
}))

const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

const action = require('../actions/commerce/product-validate-stock.js')

beforeEach(() => {
    Core.Logger.mockClear()
    mockLoggerInstance.info.mockReset()
    mockLoggerInstance.debug.mockReset()
    mockLoggerInstance.error.mockReset()
})

const fakeParams = { __ow_headers: { authorization: 'Bearer fakeToken', 'x-gw-ims-org-id': 'fakeOrgId' } }
describe('product-validate-stock', () => {
    test('main should be defined', () => {
        expect(action.main).toBeInstanceOf(Function)
    })
    test('should set logger to use LOG_LEVEL param', async () => {
        await action.main({ ...fakeParams, LOG_LEVEL: 'fakeLevel' })
        expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
    })
    test('missing input request parameters, should return 400', async () => {
        const response = await action.main({})
        expect(response).toEqual({
            error: {
                statusCode: 400,
                body: { error: 'missing header(s) \'authorization\' and missing parameter(s) \'product,info\'' }
            }
        })
    })
    test('product in stock', async () => {
        const response = await action.main({
            ...fakeParams,
            info: {
                qty: 1
            },
            product: {
                quantity_and_stock_status: {
                    is_in_stock: true,
                    qty: 10
                }
            }
        })

        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify({
                op: 'success'
            })
        })
    })
    test('product not in stock', async () => {
        const response = await action.main({
            ...fakeParams,
            info: {
                qty: 1
            },
            product: {
                quantity_and_stock_status: {
                    is_in_stock: false,
                    qty: 10
                }
            }
        })

        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify({
                op: 'exception',
                message: 'The product is out of stock.'
            })
        })
    })
})

import { initTsIo } from '../initTsIo'
import { mergeContracts } from '../utils'
import { searchContract, socialContract } from './contracts'

const contract = mergeContracts(searchContract, socialContract)
const tsIo = initTsIo.create(contract, { user: { name: null } })

const authMiddleware = tsIo.middleware(opts => {
  console.log('authMiddleware', opts)
  return opts.next({ ctx: { user: { name: 'Xavier' as const } } })
})

export { authMiddleware, tsIo }

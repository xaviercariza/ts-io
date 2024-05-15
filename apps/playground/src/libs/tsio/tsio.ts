import { initTsIo } from '@tsio/core'
import { chatContract } from './contract'

const tsIo = initTsIo(chatContract, { user: { name: null } })

export { tsIo }

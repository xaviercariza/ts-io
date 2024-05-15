import { initTsIo } from '@tsio/core'
import { chatContract } from './contract'

const tsIo = initTsIo.create(chatContract, { user: { name: null } })

export { tsIo }

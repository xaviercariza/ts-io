import { searchRouter } from './search'
import { socialRouter } from './social'
import { tsIo } from './tsio'

async function run() {
  const rootRouter = tsIo.router.create({
    social: socialRouter,
    search: searchRouter,
  })

  const result = await rootRouter.search.searchPlayer({
    emitTo: () => {},
    input: {
      search: 'pla',
    },
    path: 'search.searchPlayer',
  })
}

run()

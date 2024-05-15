import { authMiddleware, tsIo } from './tsio'

const searchRouter = tsIo.router.search.create(a => ({
  searchPlayer: a.searchPlayer.use(authMiddleware).handler(opts => {
    const player = {
      id: 'player-1',
      nickname: opts.ctx.user.name,
    }
    return { success: true, data: player }
  }),
}))

export { searchRouter }

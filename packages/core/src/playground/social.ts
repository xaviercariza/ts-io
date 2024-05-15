import { tsIo } from './tsio'

const router3Router = tsIo.router.router3.create(a => ({
  sendFriendRequest: a.sendFriendRequest
    .use(opts => opts.next({ ctx: { name: 'Clara' as const } }))
    .handler(() => {}),
  declineFriendRequest: a.declineFriendRequest
    .use(opts => opts.next({ ctx: { name: 'Clara' as const } }))
    .handler(opts => {
      // opts.emitEventTo('')
    }),
}))

const router1Router = tsIo.router.router1.create({
  router3: router3Router,
})

const socialRouter = tsIo.router.social.create({
  router1: router1Router,
  router2: {},
})

export { socialRouter }

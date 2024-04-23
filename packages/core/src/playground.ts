import { z } from 'zod'
import { initContract, mergeContracts } from './contract'
import { attachTsIoToWebSocket, initTsIo } from './server/server'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
})

const c = initContract()

const createPostAction = c.action({
  input: z.string(),
})

const onPostCreatedListener = c.listener({
  data: PostSchema,
})

const socialSearchRouter = c.router({
  actions: {
    social: {
      search: {
        searchPlayer: createPostAction,
        sendFriendRequest: createPostAction,
      },
    },
  },
  listeners: {
    social: {
      search: {
        onPlayerSearched: onPostCreatedListener,
        onFriendRequestReceived: onPostCreatedListener,
      },
    },
  },
})

const socialFriendsRouter = c.router({
  actions: {
    social: {
      friends: {
        unfriend: createPostAction,
        sendGroupRequest: createPostAction,
      },
    },
  },
  listeners: {
    social: {
      friends: {
        onPlayerUnfriended: onPostCreatedListener,
        onGroypRequestReceived: onPostCreatedListener,
      },
    },
  },
})

const contract = mergeContracts(socialSearchRouter, socialFriendsRouter)

const s = initTsIo({}, contract)

const searchPlayerAction = s.action('social.search.searchPlayer').handler(opts => {
  opts.emitEventTo('listeners.social.search.onPlayerSearched', '', {
    id: 'post-1',
    title: 'Post title',
    content: 'Post content',
  })
})
const sendGroypRequestAction = s.action('social.friends.sendGroupRequest').handler(() => {})

const router = s.router({
  social: {
    search: {
      searchPlayer: searchPlayerAction,
      sendFriendRequest: searchPlayerAction,
    },
    friends: {
      sendGroupRequest: sendGroypRequestAction,
      unfriend: sendGroypRequestAction,
    },
  },
})

const adapterMock = { on: () => {}, emitTo: () => {} }
attachTsIoToWebSocket(router, adapterMock)

const execute = async () => {
  await router.social.search.searchPlayer({
    path: 'createPost',
    emitTo: () => {},
    input: 'Player 1',
  })
}
execute()

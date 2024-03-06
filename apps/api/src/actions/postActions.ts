import { initServer } from '@ts-io/core'
import { postContract } from '@ts-io/utils'

const s = initServer()
const postActions = s.actions(postContract, {
  createPost: {
    handler({ input }) {
      const newPost = {
        id: 'post-1',
        title: input.title,
        description: input.description,
      }

      console.log('Creating new post without response', JSON.stringify(newPost, null, 2))
    },
  },
})

export { postActions }

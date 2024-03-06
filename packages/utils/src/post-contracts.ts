import { initContract } from '@ts-io/core'
import { z } from 'zod'

const c = initContract()

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
})

export const postContract = c.actions({
  actions: {
    createPost: {
      input: PostSchema.omit({ id: true }),
      // response: PostSchema,
    },
  },
})

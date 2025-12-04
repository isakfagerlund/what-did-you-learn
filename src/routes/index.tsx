import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { learningsTable } from '@/db/schema'
import { useState } from 'react'

const getLearnings = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await db.query.learningsTable.findMany()
})

const createLearning = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { content: string }) => data)
  .handler(async ({ data }) => {
    await db.insert(learningsTable).values({ content: data.content })
    return { success: true }
  })

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => await getLearnings(),
})

function App() {
  const router = useRouter()
  const learnings = Route.useLoaderData()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createLearning({ data: { content: content.trim() } })
      router.invalidate()
      setContent('')
    } catch (error) {
      console.error('Failed to create learning:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">What did you learn today?</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter what you learned..."
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors self-start"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Recent entries</h3>
          {learnings?.length === 0 ? (
            <p className="text-gray-400">
              No entries yet. Add your first learning above!
            </p>
          ) : (
            <ul className="space-y-3">
              {learnings?.map((learning) => (
                <li
                  key={learning.id}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-800"
                >
                  <p className="text-white whitespace-pre-wrap">
                    {learning.content}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(learning.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

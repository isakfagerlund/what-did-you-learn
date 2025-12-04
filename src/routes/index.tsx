import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { learningsTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'

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

const updateLearning = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { id: number; content: string }) => data)
  .handler(async ({ data }) => {
    await db
      .update(learningsTable)
      .set({ content: data.content })
      .where(eq(learningsTable.id, data.id))
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
  const [editingLearning, setEditingLearning] = useState<{
    id: number
    content: string
  } | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  const handleCardClick = (learning: { id: number; content: string }) => {
    setEditingLearning(learning)
    setEditContent(learning.content)
  }

  const handleSaveEdit = async () => {
    if (!editingLearning || !editContent.trim() || isSaving) return

    setIsSaving(true)
    try {
      await updateLearning({
        data: { id: editingLearning.id, content: editContent.trim() },
      })
      router.invalidate()
      setEditingLearning(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to update learning:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseDrawer = () => {
    setEditingLearning(null)
    setEditContent('')
  }

  return (
    <div className="h-screen bg-background text-foreground p-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto mb-8">
          <h3 className="text-xl font-semibold mb-4">Recent entries</h3>
          {learnings?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  No entries yet. Add your first learning below!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {learnings?.map((learning) => (
                <Card
                  key={learning.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleCardClick(learning)}
                >
                  <CardContent>
                    <p className="whitespace-pre-wrap">{learning.content}</p>
                    <CardDescription className="mt-2">
                      {new Date(learning.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="shrink-0">
          <CardHeader>
            <CardTitle>What did you learn today?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter what you learned..."
                rows={3}
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="self-start"
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Drawer
        open={editingLearning !== null}
        onOpenChange={(open) => !open && handleCloseDrawer()}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Learning</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter what you learned..."
              rows={8}
              disabled={isSaving}
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={handleSaveEdit}
              disabled={!editContent.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

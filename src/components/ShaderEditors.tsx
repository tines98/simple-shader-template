import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ShaderEditors({
  vs,
  fs,
  setVS,
  setFS,
}: {
  vs: string
  fs: string
  setVS: (s: string) => void
  setFS: (s: string) => void
}) {
  return (
    <div className="grid grid-rows-[auto,1fr] h-full">
      <Tabs defaultValue="fragment" className="h-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="vertex">Vertex</TabsTrigger>
          <TabsTrigger value="fragment">Fragment</TabsTrigger>
        </TabsList>
        <TabsContent value="vertex" className="h-[calc(100%-2rem)]">
          <Textarea
            className="h-full min-h-[240px] resize-y font-mono text-sm"
            value={vs}
            onChange={(e) => setVS(e.currentTarget.value)}
          />
        </TabsContent>
        <TabsContent value="fragment" className="h-[calc(100%-2rem)]">
          <Textarea
            className="h-full min-h-[240px] resize-y font-mono text-sm"
            value={fs}
            onChange={(e) => setFS(e.currentTarget.value)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

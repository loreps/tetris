import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function GameRules() {
  return (
    <Card className="w-full border-tetris-turquoise/30">
      <CardHeader>
        <CardTitle className="text-tetris-turquoise">Game Rules and Mechanics</CardTitle>
        <CardDescription>Learn how to play Linera Tetris and use special blocks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Rules</TabsTrigger>
            <TabsTrigger value="special">Special Blocks</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium text-tetris-red mb-2">Basic Tetris Rules</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>The game is played on a 10×20 grid.</li>
                <li>Shapes (tetrominoes) fall from the top of the grid.</li>
                <li>The player can rotate shapes and move them left, right, and down.</li>
                <li>The goal is to fill horizontal rows with blocks to clear them.</li>
                <li>When a row is completely filled, it disappears and the player scores points.</li>
                <li>The game ends when new shapes can't enter the grid.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-tetris-turquoise mb-2">Scoring System</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <span className="font-medium">1 row:</span> 40 × level
                </li>
                <li>
                  <span className="font-medium">2 rows:</span> 100 × level
                </li>
                <li>
                  <span className="font-medium">3 rows:</span> 300 × level
                </li>
                <li>
                  <span className="font-medium">4 rows (Tetris):</span> 1200 × level
                </li>
                <li>The level increases after every 10 rows cleared.</li>
                <li>With each level, the falling speed of shapes increases.</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="special" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium text-tetris-red mb-2">Special Blocks</h3>
              <p className="text-sm mb-4">
                Our version of Linera Tetris includes special blocks with unique abilities:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tetris-red to-tetris-turquoise flex-shrink-0 mt-1"></div>
                  <div>
                    <h4 className="font-medium">Color Bomb</h4>
                    <p className="text-sm text-muted-foreground">
                      Destroys all blocks of the same color it comes in contact with. Earn bonus points for each block
                      destroyed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-300 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-6 h-1.5 bg-yellow-500"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Row Clearer</h4>
                    <p className="text-sm text-muted-foreground">
                      Instantly clears the entire row it's placed on. Perfect for unblocking difficult situations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-300 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-1.5 h-6 bg-blue-500"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Column Clearer</h4>
                    <p className="text-sm text-muted-foreground">
                      Instantly clears the entire column it's placed on. Helps create space for new shapes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-300 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-6 h-1.5 bg-purple-500"></div>
                    <div className="w-1.5 h-6 bg-purple-500 absolute"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Cross Clearer</h4>
                    <p className="text-sm text-muted-foreground">
                      Clears both the row and column, creating a cross-shaped effect. A powerful tool for scoring big
                      points.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-300 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-4 h-4 border-b-2 border-r-2 border-green-700 rotate-45"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Gravity Block</h4>
                    <p className="text-sm text-muted-foreground">
                      Pulls all blocks down, filling in gaps. Helps reorganize the playing field and create
                      opportunities for clearing rows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium text-tetris-red mb-2">Keyboard Controls</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Left Arrow</span>
                    <span className="text-muted-foreground">Move Left</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Right Arrow</span>
                    <span className="text-muted-foreground">Move Right</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Down Arrow</span>
                    <span className="text-muted-foreground">Soft Drop</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Up Arrow</span>
                    <span className="text-muted-foreground">Rotate</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Spacebar</span>
                    <span className="text-muted-foreground">Hard Drop</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">P</span>
                    <span className="text-muted-foreground">Pause</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-tetris-turquoise mb-2">Tips for Beginners</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Try to keep the playing field as low as possible.</li>
                <li>Leave space for the I-shaped piece (the straight line) to clear 4 rows at once.</li>
                <li>Use the "ghost" feature (transparent piece at the bottom) to see where your piece will land.</li>
                <li>
                  Plan ahead and think about how to place the current piece to create opportunities for the next ones.
                </li>
                <li>Use special blocks strategically to get out of difficult situations or to score more points.</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { COLOR_SCHEMES, type ColorSchemeName } from "./color-scheme-selector"
import { BOARD_THEMES, type BoardThemeName } from "./board-theme-selector"
import ParticleEffect from "./particle-effect"

// Define Tetromino shapes
const TETROMINO_SHAPES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  J: {
    shape: [
      [0, 0, 0],
      [2, 2, 2],
      [0, 0, 2],
    ],
  },
  L: {
    shape: [
      [0, 0, 0],
      [3, 3, 3],
      [3, 0, 0],
    ],
  },
  O: {
    shape: [
      [4, 4],
      [4, 4],
    ],
  },
  S: {
    shape: [
      [0, 0, 0],
      [0, 5, 5],
      [5, 5, 0],
    ],
  },
  T: {
    shape: [
      [0, 0, 0],
      [6, 6, 6],
      [0, 6, 0],
    ],
  },
  Z: {
    shape: [
      [0, 0, 0],
      [7, 7, 0],
      [0, 7, 7],
    ],
  },
  // Special blocks with different powers
  B: {
    // Color Bomb - destroys all blocks of the same color
    shape: [[8]],
    special: true,
    type: "bomb",
    description: "Destroys all blocks of the same color",
  },
  R: {
    // Row Clearer - clears the entire row
    shape: [[9]],
    special: true,
    type: "row",
    description: "Clears the entire row",
  },
  C: {
    // Column Clearer - clears the entire column
    shape: [[10]],
    special: true,
    type: "column",
    description: "Clears the entire column",
  },
  X: {
    // Cross Clearer - clears the row and column (cross shape)
    shape: [[11]],
    special: true,
    type: "cross",
    description: "Clears the row and column in a cross shape",
  },
  G: {
    // Gravity Block - pulls all blocks down, filling gaps
    shape: [[12]],
    special: true,
    type: "gravity",
    description: "Pulls all blocks down, filling gaps",
  },
}

// Function to create tetrominos with the selected color scheme
const createTetrominos = (colorScheme: ColorSchemeName) => {
  const colors = COLOR_SCHEMES[colorScheme]
  return {
    I: { ...TETROMINO_SHAPES.I, color: colors.I },
    J: { ...TETROMINO_SHAPES.J, color: colors.J },
    L: { ...TETROMINO_SHAPES.L, color: colors.L },
    O: { ...TETROMINO_SHAPES.O, color: colors.O },
    S: { ...TETROMINO_SHAPES.S, color: colors.S },
    T: { ...TETROMINO_SHAPES.T, color: colors.T },
    Z: { ...TETROMINO_SHAPES.Z, color: colors.Z },
    B: {
      ...TETROMINO_SHAPES.B,
      color: "bg-white",
      special: true,
      type: "bomb",
    },
    R: {
      ...TETROMINO_SHAPES.R,
      color: "bg-yellow-300",
      special: true,
      type: "row",
    },
    C: {
      ...TETROMINO_SHAPES.C,
      color: "bg-blue-300",
      special: true,
      type: "column",
    },
    X: {
      ...TETROMINO_SHAPES.X,
      color: "bg-purple-300",
      special: true,
      type: "cross",
    },
    G: {
      ...TETROMINO_SHAPES.G,
      color: "bg-green-300",
      special: true,
      type: "gravity",
    },
  }
}

// Initial game state - create an empty stage
const createStage = () => {
  return Array.from(Array(20), () => Array.from(Array(10), () => [0, "clear", null]))
}

// Random tetromino generator with configurable special block frequency
const randomTetromino = (tetrominos, specialBlockFrequency = 15) => {
  const regularTetrominoKeys = Object.keys(tetrominos).filter((key) => !tetrominos[key].special)
  const specialTetrominoKeys = Object.keys(tetrominos).filter((key) => tetrominos[key].special)

  // Use the configured special block frequency (as a percentage)
  if (Math.random() * 100 < specialBlockFrequency) {
    const randSpecialKey = specialTetrominoKeys[Math.floor(Math.random() * specialTetrominoKeys.length)]
    return tetrominos[randSpecialKey]
  }

  const randKey = regularTetrominoKeys[Math.floor(Math.random() * regularTetrominoKeys.length)]
  return tetrominos[randKey]
}

interface TetrisGameProps {
  difficulty: number
  specialBlockFrequency?: number
  onGameOver: (score: number) => void
  setScore: (score: number) => void
  timeRemaining: number
}

export default function TetrisGame({
  difficulty,
  specialBlockFrequency = 15,
  onGameOver,
  setScore,
  timeRemaining,
}: TetrisGameProps) {
  // Game state
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>("classic")
  const [boardTheme, setBoardTheme] = useState<BoardThemeName>("classic")
  const [tetrominos, setTetrominos] = useState(() => createTetrominos(colorScheme))
  const [stage, setStage] = useState(createStage)
  const [dropTime, setDropTime] = useState<null | number>(null)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [rowsCleared, setRowsCleared] = useState(0)
  const [activeSpecialBlock, setActiveSpecialBlock] = useState<string | null>(null)

  // Particle effect state
  const [particleEffects, setParticleEffects] = useState<
    Array<{
      id: number
      x: number
      y: number
      color: string
      count?: number
    }>
  >([])

  // Throttle particle effects to prevent too many at once
  const lastParticleTimeRef = useRef(0)
  const particleThrottleRef = useRef(100) // ms between particle effects

  // Player state - initialized with null to prevent premature collision detection
  const [player, setPlayer] = useState<any>(null)
  const playerRef = useRef<any>(null)
  const stageRef = useRef(stage)

  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameStartedRef = useRef(false)
  const requestRef = useRef<number | null>(null)
  const dropTimeRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const stageUpdateRef = useRef(false)
  const gameInitializedRef = useRef(false)
  const ghostPositionRef = useRef<any>(null)
  const updateInProgressRef = useRef(false)
  const keyPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isKeyDownRef = useRef<{ [key: string]: boolean }>({})
  const cellSizeRef = useRef({ width: 36, height: 36 }) // Default cell size (9 * 4)

  // Load color scheme from localStorage
  useEffect(() => {
    const savedScheme = localStorage.getItem("tetris_color_scheme") as ColorSchemeName | null
    if (savedScheme && COLOR_SCHEMES[savedScheme]) {
      setColorScheme(savedScheme)
      setTetrominos(createTetrominos(savedScheme))
    }

    const savedBoardTheme = localStorage.getItem("tetris_board_theme") as BoardThemeName | null
    if (savedBoardTheme && BOARD_THEMES[savedBoardTheme]) {
      setBoardTheme(savedBoardTheme)
    }
  }, [])

  // Listen for color scheme changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "tetris_color_scheme" && e.newValue && COLOR_SCHEMES[e.newValue as ColorSchemeName]) {
        const newScheme = e.newValue as ColorSchemeName
        setColorScheme(newScheme)
        setTetrominos(createTetrominos(newScheme))
      }

      if (e.key === "tetris_board_theme" && e.newValue && BOARD_THEMES[e.newValue as BoardThemeName]) {
        setBoardTheme(e.newValue as BoardThemeName)
      }
    }

    const handleBoardThemeChange = (e: CustomEvent) => {
      if (e.detail && e.detail.theme && BOARD_THEMES[e.detail.theme as BoardThemeName]) {
        setBoardTheme(e.detail.theme as BoardThemeName)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("boardthemechange", handleBoardThemeChange as EventListener)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("boardthemechange", handleBoardThemeChange as EventListener)
    }
  }, [])

  // Calculate drop time based on level
  const calcDropTime = useCallback(() => {
    return 1000 / (level + difficulty * 0.2)
  }, [level, difficulty])

  // Simplified collision detection
  const checkCollision = useCallback((playerObj, stageObj, { x: moveX, y: moveY }) => {
    // If player is not initialized yet, return false
    if (!playerObj) return false

    for (let y = 0; y < playerObj.tetromino.length; y++) {
      for (let x = 0; x < playerObj.tetromino[y].length; x++) {
        // Check if we're on a tetromino cell
        if (playerObj.tetromino[y][x] !== 0) {
          // Check movement is inside game area height (y)
          if (
            !stageObj[y + playerObj.pos.y + moveY] ||
            // Check movement is inside game area width (x)
            !stageObj[y + playerObj.pos.y + moveY][x + playerObj.pos.x + moveX] ||
            // Check if cell we're moving to isn't set to clear
            stageObj[y + playerObj.pos.y + moveY][x + playerObj.pos.x + moveX][1] === "merged"
          ) {
            return true
          }
        }
      }
    }
    return false
  }, [])

  // Calculate ghost piece position - memoized to prevent recalculation on every render
  const getGhostPosition = useCallback(
    (playerObj, stageObj) => {
      if (!playerObj) return null

      let ghostY = playerObj.pos.y
      const maxIterations = stageObj.length // Prevent infinite loops
      let iterations = 0

      // Move the ghost piece down until it collides
      while (
        !checkCollision(playerObj, stageObj, { x: 0, y: ghostY - playerObj.pos.y + 1 }) &&
        iterations < maxIterations
      ) {
        ghostY++
        iterations++
      }

      // Return the ghost position
      return {
        ...playerObj,
        pos: { x: playerObj.pos.x, y: ghostY },
      }
    },
    [checkCollision],
  )

  // Add a particle effect with throttling
  const addParticleEffect = useCallback((x: number, y: number, color: string, count = 20) => {
    const now = Date.now()
    if (now - lastParticleTimeRef.current < particleThrottleRef.current) {
      // Skip this particle effect if we've added one too recently
      return
    }

    lastParticleTimeRef.current = now

    setParticleEffects((prev) => {
      // Limit total number of effects
      const maxEffects = 10
      if (prev.length >= maxEffects) {
        return [
          ...prev.slice(-maxEffects + 1),
          {
            id: now + Math.random() * 1000,
            x,
            y,
            color,
            count,
          },
        ]
      }
      return [
        ...prev,
        {
          id: now + Math.random() * 1000,
          x,
          y,
          color,
          count,
        },
      ]
    })
  }, [])

  // Function to clear blocks of the same color (for bomb block)
  const clearBlocksOfColor = useCallback(
    (stageObj, colorToRemove) => {
      if (!colorToRemove) return stageObj

      let blocksRemoved = 0
      const removedBlockPositions: Array<{ x: number; y: number }> = []

      const newStage = stageObj.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (cell[1] === "merged" && cell[2] === colorToRemove) {
            blocksRemoved++
            // Store position of removed block for particle effect
            removedBlockPositions.push({
              x: colIndex * cellSizeRef.current.width + cellSizeRef.current.width / 2,
              y: rowIndex * cellSizeRef.current.height + cellSizeRef.current.height / 2,
            })
            return [0, "clear", null]
          }
          return cell
        }),
      )

      // Add points for removed blocks
      if (blocksRemoved > 0) {
        // Add bonus points for using the special block
        const points = blocksRemoved * 100 * level + 500
        setCurrentScore((prev) => prev + points)

        // Create particle effects for each removed block
        if (removedBlockPositions.length > 0) {
          // Create a single effect at the center of mass of all removed blocks
          const avgX = removedBlockPositions.reduce((sum, pos) => sum + pos.x, 0) / removedBlockPositions.length
          const avgY = removedBlockPositions.reduce((sum, pos) => sum + pos.y, 0) / removedBlockPositions.length

          addParticleEffect(avgX, avgY, colorToRemove, 30)

          // Also create smaller effects at a few random block positions (not all to avoid performance issues)
          const maxIndividualEffects = Math.min(5, removedBlockPositions.length)
          for (let i = 0; i < maxIndividualEffects; i++) {
            const randomIndex = Math.floor(Math.random() * removedBlockPositions.length)
            const pos = removedBlockPositions[randomIndex]
            addParticleEffect(pos.x, pos.y, colorToRemove, 10)
          }
        }
      }

      return newStage
    },
    [level, addParticleEffect],
  )

  // Function to clear an entire row (for row clearer block)
  const clearRow = useCallback(
    (stageObj, rowIndex) => {
      if (rowIndex < 0 || rowIndex >= stageObj.length) return stageObj

      let blocksRemoved = 0
      const removedBlockPositions: Array<{ x: number; y: number; color: string }> = []

      // Create a copy of the stage
      const newStage = [...stageObj]

      // Find blocks to remove and their positions
      newStage[rowIndex].forEach((cell, colIndex) => {
        if (cell[1] === "merged") {
          blocksRemoved++
          removedBlockPositions.push({
            x: colIndex * cellSizeRef.current.width + cellSizeRef.current.width / 2,
            y: rowIndex * cellSizeRef.current.height + cellSizeRef.current.height / 2,
            color: cell[2] as string,
          })
        }
      })

      // Clear the row
      newStage[rowIndex] = Array(newStage[rowIndex].length).fill([0, "clear", null])

      // Add points for removed blocks
      if (blocksRemoved > 0) {
        const points = blocksRemoved * 100 * level + 300
        setCurrentScore((prev) => prev + points)

        // Create a horizontal line particle effect
        const middleY = rowIndex * cellSizeRef.current.height + cellSizeRef.current.height / 2
        addParticleEffect(5 * cellSizeRef.current.width, middleY, "bg-yellow-300", 30)

        // Add a few individual block effects
        const maxIndividualEffects = Math.min(3, removedBlockPositions.length)
        for (let i = 0; i < maxIndividualEffects; i++) {
          const randomIndex = Math.floor(Math.random() * removedBlockPositions.length)
          const pos = removedBlockPositions[randomIndex]
          addParticleEffect(pos.x, pos.y, pos.color, 10)
        }
      }

      return newStage
    },
    [level, addParticleEffect],
  )

  // Function to clear an entire column (for column clearer block)
  const clearColumn = useCallback(
    (stageObj, colIndex) => {
      if (colIndex < 0 || colIndex >= stageObj[0].length) return stageObj

      let blocksRemoved = 0
      const removedBlockPositions: Array<{ x: number; y: number; color: string }> = []

      // Create a copy of the stage
      const newStage = stageObj.map((row, rowIndex) => {
        return row.map((cell, cellColIndex) => {
          if (cellColIndex === colIndex && cell[1] === "merged") {
            blocksRemoved++
            removedBlockPositions.push({
              x: colIndex * cellSizeRef.current.width + cellSizeRef.current.width / 2,
              y: rowIndex * cellSizeRef.current.height + cellSizeRef.current.height / 2,
              color: cell[2] as string,
            })
            return [0, "clear", null]
          }
          return cell
        })
      })

      // Add points for removed blocks
      if (blocksRemoved > 0) {
        const points = blocksRemoved * 100 * level + 300
        setCurrentScore((prev) => prev + points)

        // Create a vertical line particle effect
        const middleX = colIndex * cellSizeRef.current.width + cellSizeRef.current.width / 2
        addParticleEffect(middleX, 10 * cellSizeRef.current.height, "bg-blue-300", 30)

        // Add a few individual block effects
        const maxIndividualEffects = Math.min(3, removedBlockPositions.length)
        for (let i = 0; i < maxIndividualEffects; i++) {
          const randomIndex = Math.floor(Math.random() * removedBlockPositions.length)
          const pos = removedBlockPositions[randomIndex]
          addParticleEffect(pos.x, pos.y, pos.color, 10)
        }
      }

      return newStage
    },
    [level, addParticleEffect],
  )

  // Function to clear a cross shape (row and column)
  const clearCross = useCallback(
    (stageObj, rowIndex, colIndex) => {
      if (rowIndex < 0 || rowIndex >= stageObj.length || colIndex < 0 || colIndex >= stageObj[0].length) return stageObj

      // First clear the row
      let newStage = clearRow(stageObj, rowIndex)

      // Then clear the column
      newStage = clearColumn(newStage, colIndex)

      // Create a cross particle effect
      const centerX = colIndex * cellSizeRef.current.width + cellSizeRef.current.width / 2
      const centerY = rowIndex * cellSizeRef.current.height + cellSizeRef.current.height / 2

      addParticleEffect(centerX, centerY, "bg-purple-300", 40)

      return newStage
    },
    [clearRow, clearColumn, addParticleEffect],
  )

  // Function to apply gravity to all blocks (pull them down)
  const applyGravity = useCallback(
    (stageObj) => {
      let blocksAffected = 0

      // Create a deep copy of the stage to avoid reference issues
      const newStage = stageObj.map((row) => row.map((cell) => [...cell]))

      // For each column
      for (let col = 0; col < stageObj[0].length; col++) {
        // Get all blocks in this column
        const blocksInColumn = []

        for (let row = 0; row < stageObj.length; row++) {
          if (stageObj[row][col][1] === "merged") {
            blocksInColumn.push([...stageObj[row][col]])
            // Clear the original position
            newStage[row][col] = [0, "clear", null]
          }
        }

        // Place blocks at the bottom
        for (let i = 0; i < blocksInColumn.length; i++) {
          const targetRow = stageObj.length - 1 - i
          if (targetRow >= 0 && targetRow < newStage.length) {
            newStage[targetRow][col] = blocksInColumn[blocksInColumn.length - 1 - i]
            blocksAffected++
          }
        }
      }

      // Add points for affected blocks
      if (blocksAffected > 0) {
        const points = blocksAffected * 20 * level
        setCurrentScore((prev) => prev + points)

        // Create a gravity particle effect
        addParticleEffect(5 * cellSizeRef.current.width, 10 * cellSizeRef.current.height, "bg-green-300", 40)
      }

      return newStage
    },
    [level, addParticleEffect],
  )

  // Reset player
  const resetPlayer = useCallback(() => {
    // Use the configured special block frequency
    const newPiece = randomTetromino(tetrominos, specialBlockFrequency)

    const initialPlayer = {
      pos: { x: 3, y: 0 }, // Start slightly to the left
      tetromino: newPiece.shape,
      tetrominoColor: newPiece.color,
      collided: false,
      special: newPiece.special || false,
      type: newPiece.type || null,
    }

    setPlayer(initialPlayer)
    playerRef.current = initialPlayer

    // Update active special block
    if (newPiece.special) {
      setActiveSpecialBlock(newPiece.type)
    } else {
      setActiveSpecialBlock(null)
    }
  }, [tetrominos, specialBlockFrequency])

  // Initialize the game
  useEffect(() => {
    // Prevent multiple initializations
    if (gameInitializedRef.current) return
    gameInitializedRef.current = true

    // Reset game state
    const initialStage = createStage()
    setStage(initialStage)
    stageRef.current = initialStage
    setCurrentScore(0)
    setLevel(1)
    setRowsCleared(0)
    setGameOver(false)
    setIsPaused(false)

    // Generate first tetromino with the configured special block frequency
    const firstPiece = randomTetromino(tetrominos, specialBlockFrequency)

    // Set initial player position with the first piece
    const initialPlayer = {
      pos: { x: 3, y: 0 }, // Start slightly to the left to avoid immediate collision
      tetromino: firstPiece.shape,
      tetrominoColor: firstPiece.color,
      collided: false,
      special: firstPiece.special || false,
      type: firstPiece.type || null,
    }

    setPlayer(initialPlayer)
    playerRef.current = initialPlayer

    // Update active special block
    if (firstPiece.special) {
      setActiveSpecialBlock(firstPiece.type)
    }

    // Set drop time
    setDropTime(calcDropTime())

    // Focus the game area for keyboard controls
    if (gameAreaRef.current) {
      gameAreaRef.current.focus()
    }

    // Mark game as started
    gameStartedRef.current = true

    // Clean up on unmount
    return () => {
      gameStartedRef.current = false
      gameInitializedRef.current = false
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      if (keyPressTimeoutRef.current) {
        clearTimeout(keyPressTimeoutRef.current)
      }
      isKeyDownRef.current = {}
    }
  }, [tetrominos, calcDropTime, resetPlayer, specialBlockFrequency])

  // Update score
  useEffect(() => {
    setScore(currentScore)
  }, [currentScore, setScore])

  // Game over when time is up
  useEffect(() => {
    if (!gameStartedRef.current) return

    if (timeRemaining <= 0) {
      setGameOver(true)
    }
  }, [timeRemaining])

  // Handle game over
  useEffect(() => {
    if (gameOver && gameStartedRef.current) {
      onGameOver(currentScore)
    }
  }, [gameOver, currentScore, onGameOver])

  // Update ghost position when player moves
  useEffect(() => {
    if (!player || !stage) return

    // Calculate new ghost position
    ghostPositionRef.current = getGhostPosition(player, stage)

    // Update player ref
    playerRef.current = player
    stageRef.current = stage
  }, [player, stage, getGhostPosition])

  // Update stage function - optimized to prevent infinite loops
  const updateStage = useCallback(() => {
    // If player is not initialized yet, return current stage
    if (!playerRef.current) return stageRef.current

    // First flush the stage
    const newStage = stageRef.current.map((row) =>
      row.map((cell) => (cell[1] === "clear" || cell[1] === "ghost" ? [0, "clear", null] : cell)),
    )

    // Get ghost position from ref to avoid dependency issues
    const ghostPiece = ghostPositionRef.current

    // Draw the ghost piece first (so it appears behind the actual piece)
    if (ghostPiece && !playerRef.current.collided) {
      ghostPiece.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            if (
              y + ghostPiece.pos.y >= 0 &&
              y + ghostPiece.pos.y < newStage.length &&
              x + ghostPiece.pos.x >= 0 &&
              x + ghostPiece.pos.x < newStage[0].length &&
              // Only draw ghost if there's no piece already there
              newStage[y + ghostPiece.pos.y][x + ghostPiece.pos.x][0] === 0
            ) {
              newStage[y + ghostPiece.pos.y][x + ghostPiece.pos.x] = [value, "ghost", ghostPiece.tetrominoColor]
            }
          }
        })
      })
    }

    // Draw the actual tetromino
    playerRef.current.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (
            y + playerRef.current.pos.y >= 0 &&
            y + playerRef.current.pos.y < newStage.length &&
            x + playerRef.current.pos.x >= 0 &&
            x + playerRef.current.pos.x < newStage[0].length
          ) {
            newStage[y + playerRef.current.pos.y][x + playerRef.current.pos.x] = [
              value,
              playerRef.current.collided ? "merged" : "clear",
              playerRef.current.tetrominoColor,
            ]
          }
        }
      })
    })

    // Check if we collided
    if (playerRef.current.collided) {
      // Game over check - only if we collided at the top of the board
      if (playerRef.current.pos.y < 1) {
        setGameOver(true)
        return newStage
      }

      // Special block logic based on type
      let updatedStage = newStage

      if (playerRef.current.special) {
        const specialBlockX = playerRef.current.pos.x
        const specialBlockY = playerRef.current.pos.y

        // Create a special particle effect at the special block position
        const specialBlockPosX = specialBlockX * cellSizeRef.current.width + cellSizeRef.current.width / 2
        const specialBlockPosY = specialBlockY * cellSizeRef.current.height + cellSizeRef.current.height / 2

        addParticleEffect(specialBlockPosX, specialBlockPosY, playerRef.current.tetrominoColor, 20)

        // First remove the special block itself from the stage
        playerRef.current.tetromino.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value !== 0) {
              const posY = y + playerRef.current.pos.y
              const posX = x + playerRef.current.pos.x
              if (posY >= 0 && posY < updatedStage.length && posX >= 0 && posX < updatedStage[0].length) {
                // Clear the special block
                updatedStage[posY][posX] = [0, "clear", null]
              }
            }
          })
        })

        // Apply special block effect based on type
        switch (playerRef.current.type) {
          case "bomb": {
            // Find the color of the block the bomb collided with
            let collidedColor = null

            // Check all adjacent cells to find a merged block
            const directions = [
              { x: 0, y: 1 }, // down
              { x: 1, y: 0 }, // right
              { x: -1, y: 0 }, // left
              { x: 0, y: -1 }, // up
              { x: 1, y: 1 }, // diagonal down-right
              { x: -1, y: 1 }, // diagonal down-left
              { x: 1, y: -1 }, // diagonal up-right
              { x: -1, y: -1 }, // diagonal up-left
            ]

            // First try to find a merged block in the immediate vicinity
            for (const dir of directions) {
              const checkY = specialBlockY + dir.y
              const checkX = specialBlockX + dir.x

              if (
                checkY >= 0 &&
                checkY < newStage.length &&
                checkX >= 0 &&
                checkX < newStage[0].length &&
                newStage[checkY][checkX][1] === "merged"
              ) {
                collidedColor = newStage[checkY][checkX][2]
                break
              }
            }

            // If no adjacent block found, search the entire board for any merged block
            if (!collidedColor) {
              outerLoop: for (let y = 0; y < newStage.length; y++) {
                for (let x = 0; x < newStage[0].length; x++) {
                  if (newStage[y][x][1] === "merged") {
                    collidedColor = newStage[y][x][2]
                    break outerLoop
                  }
                }
              }
            }

            if (collidedColor) {
              // Clear blocks of the same color
              updatedStage = clearBlocksOfColor(updatedStage, collidedColor)
            }
            break
          }

          case "row":
            // Clear the entire row
            updatedStage = clearRow(updatedStage, specialBlockY)
            break

          case "column":
            // Clear the entire column
            updatedStage = clearColumn(updatedStage, specialBlockX)
            break

          case "cross":
            // Clear both row and column (cross shape)
            updatedStage = clearCross(updatedStage, specialBlockY, specialBlockX)
            break

          case "gravity":
            // Apply gravity to all blocks
            updatedStage = applyGravity(updatedStage)
            break
        }
      }

      // Check for row clearing
      let clearedRows = 0
      const finalStage = updatedStage.reduce((acc, row) => {
        // If we don't have any 0s in the row, it's full and should be cleared
        if (row.findIndex((cell) => cell[0] === 0) === -1) {
          clearedRows++
          // Add empty row at the top
          acc.unshift(Array(updatedStage[0].length).fill([0, "clear", null]))
          return acc
        }
        acc.push(row)
        return acc
      }, [])

      if (clearedRows > 0) {
        // Calculate score based on rows cleared and level
        const linePoints = [40, 100, 300, 1200]
        const newScore = currentScore + linePoints[Math.min(clearedRows - 1, 3)] * level
        setCurrentScore(newScore)

        // Update rows cleared and level
        const newRowsCleared = rowsCleared + clearedRows
        setRowsCleared(newRowsCleared)

        if (newRowsCleared >= level * 10) {
          const newLevel = level + 1
          setLevel(newLevel)
          setDropTime(calcDropTime())
        }
      }

      // Reset player
      resetPlayer()

      return finalStage
    }

    return newStage
  }, [
    calcDropTime,
    currentScore,
    level,
    rowsCleared,
    resetPlayer,
    clearBlocksOfColor,
    clearRow,
    clearColumn,
    clearCross,
    applyGravity,
    addParticleEffect,
  ])

  // Update stage on player change
  useEffect(() => {
    if (!gameStartedRef.current || gameOver || !player) return

    // Prevent infinite updates
    if (stageUpdateRef.current || updateInProgressRef.current) return
    stageUpdateRef.current = true
    updateInProgressRef.current = true

    // Update stage
    const newStage = updateStage()
    setStage(newStage)
    stageRef.current = newStage

    stageUpdateRef.current = false
    updateInProgressRef.current = false
  }, [player, gameOver, updateStage])

  // Drop player
  const drop = useCallback(() => {
    if (!playerRef.current || gameOver || isPaused) return

    if (!checkCollision(playerRef.current, stageRef.current, { x: 0, y: 1 })) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x, y: prev.pos.y + 1 },
      }))
    } else {
      setPlayer((prev) => ({
        ...prev,
        collided: true,
      }))
    }
  }, [gameOver, isPaused, checkCollision])

  // Game loop using setInterval instead of requestAnimationFrame
  useEffect(() => {
    if (gameOver || isPaused || !gameStartedRef.current || !player || !dropTime) return

    const interval = setInterval(() => {
      drop()
    }, dropTime)

    return () => {
      clearInterval(interval)
    }
  }, [drop, dropTime, gameOver, isPaused, player])

  // Drop player to bottom
  const dropToBottom = useCallback(() => {
    if (!player) return

    // Use the ghost position to determine where to drop
    const ghostPiece = ghostPositionRef.current
    if (ghostPiece) {
      setPlayer((prev) => ({
        ...prev,
        pos: { x: prev.pos.x, y: ghostPiece.pos.y },
        collided: true,
      }))
    }
  }, [player])

  // Rotate player
  const rotate = useCallback((tetromino, dir) => {
    // Make the rows become cols (transpose)
    const rotatedTetro = tetromino.map((_, index) => tetromino.map((col) => col[index]))

    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotatedTetro.map((row) => row.reverse())
    return rotatedTetro.reverse()
  }, [])

  const rotatePlayer = useCallback(
    (dir) => {
      if (!player) return

      // Don't rotate special blocks
      if (player.special) return

      const clonedPlayer = JSON.parse(JSON.stringify(player))
      clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir)

      // Check collision after rotation
      const pos = clonedPlayer.pos.x
      let offset = 1
      while (checkCollision(clonedPlayer, stageRef.current, { x: 0, y: 0 })) {
        // Try to move left and right to find a valid position
        clonedPlayer.pos.x += offset
        offset = -(offset + (offset > 0 ? 1 : -1))
        if (offset > clonedPlayer.tetromino[0].length) {
          // If we can't find a valid position, revert rotation
          rotate(clonedPlayer.tetromino, -dir)
          clonedPlayer.pos.x = pos
          return
        }
      }

      setPlayer(clonedPlayer)
    },
    [player, checkCollision, rotate],
  )

  // Move player horizontally
  const movePlayer = useCallback(
    (dir) => {
      if (!player) return

      if (!checkCollision(player, stageRef.current, { x: dir, y: 0 })) {
        setPlayer((prev) => ({
          ...prev,
          pos: { x: prev.pos.x + dir, y: prev.pos.y },
        }))
      }
    },
    [player, checkCollision],
  )

  // Handle key down with throttling to prevent rapid state updates
  const handleKeyDown = useCallback(
    (e) => {
      if (gameOver || isPaused || !player) return

      // Mark key as pressed
      isKeyDownRef.current[e.key] = true

      switch (e.key) {
        case "ArrowLeft":
          movePlayer(-1)
          break
        case "ArrowRight":
          movePlayer(1)
          break
        case "ArrowDown":
          // Throttle down key to prevent game over
          if (!keyPressTimeoutRef.current) {
            drop()
            // Set a timeout to allow the next drop
            keyPressTimeoutRef.current = setTimeout(() => {
              keyPressTimeoutRef.current = null
              // If key is still down, trigger another drop
              if (isKeyDownRef.current["ArrowDown"]) {
                handleKeyDown({ key: "ArrowDown" })
              }
            }, 100) // Throttle to 100ms
          }
          break
        case "ArrowUp":
          rotatePlayer(1)
          break
        case " ":
          e.preventDefault()
          dropToBottom()
          break
        case "p":
        case "P":
          setIsPaused((prev) => !prev)
          break
      }
    },
    [gameOver, isPaused, player, movePlayer, drop, rotatePlayer, dropToBottom],
  )

  // Handle key up
  const handleKeyUp = useCallback((e) => {
    // Mark key as released
    isKeyDownRef.current[e.key] = false

    // Clear timeout for down key
    if (e.key === "ArrowDown" && keyPressTimeoutRef.current) {
      clearTimeout(keyPressTimeoutRef.current)
      keyPressTimeoutRef.current = null
    }
  }, [])

  // Add key up listener
  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyUp])

  // Get current board theme styles
  const boardThemeStyles = BOARD_THEMES[boardTheme]

  // Handle particle effect completion
  const handleParticleComplete = useCallback((id: number) => {
    setParticleEffects((prev) => prev.filter((effect) => effect.id !== id))
  }, [])

  // Measure cell size on mount
  useEffect(() => {
    if (gameAreaRef.current) {
      const cells = gameAreaRef.current.querySelectorAll(".grid > div")
      if (cells.length > 0) {
        const cell = cells[0]
        const rect = cell.getBoundingClientRect()
        cellSizeRef.current = { width: rect.width, height: rect.height }
      }
    }
  }, [])

  // Render game cells
  const renderCell = useCallback(
    (cell) => {
      // Special styling for special blocks
      if (cell[0] >= 8 && cell[0] <= 12) {
        let specialContent

        switch (cell[0]) {
          // Color Bomb
          case 8:
            specialContent = (
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-tetris-red to-tetris-turquoise animate-pulse"></div>
            )
            break
          // Row Clearer
          case 9:
            specialContent = (
              <div className="w-5 h-1.5 bg-yellow-300 animate-pulse rounded-full shadow-lg shadow-yellow-500/50"></div>
            )
            break
          // Column Clearer
          case 10:
            specialContent = (
              <div className="w-1.5 h-5 bg-blue-300 animate-pulse rounded-full shadow-lg shadow-blue-500/50"></div>
            )
            break
          // Cross Clearer
          case 11:
            specialContent = (
              <div className="relative w-4 h-4">
                <div className="absolute left-0 top-1/2 w-4 h-1 bg-purple-300 animate-pulse rounded-full shadow-lg shadow-purple-500/50 -translate-y-1/2"></div>
                <div className="absolute top-0 left-1/2 w-1 h-4 bg-purple-300 animate-pulse rounded-full shadow-lg shadow-purple-500/50 -translate-x-1/2"></div>
              </div>
            )
            break
          // Gravity Block
          case 12:
            specialContent = (
              <div className="w-4 h-4 bg-green-300 animate-pulse rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-green-700 rotate-45"></div>
              </div>
            )
            break
          default:
            specialContent = null
        }

        return (
          <div className={`w-9 h-9 ${boardThemeStyles.cell} border ${cell[2]} flex items-center justify-center`}>
            {specialContent}
          </div>
        )
      }

      return (
        <div
          className={`w-9 h-9 ${boardThemeStyles.cell} border ${
            cell[0] !== 0
              ? cell[1] === "ghost"
                ? `${cell[2]} opacity-30 border-dashed`
                : cell[2]
              : boardThemeStyles.background
          }`}
        />
      )
    },
    [boardThemeStyles],
  )

  return (
    <div ref={gameAreaRef} tabIndex={0} onKeyDown={handleKeyDown} className="focus:outline-none">
      <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
        <div className="relative w-auto">
          {/* Game board with fixed width to prevent resizing */}
          <div
            className={`grid grid-cols-10 gap-0 w-[360px] ${boardThemeStyles.border} ${boardThemeStyles.background}`}
          >
            {stage.map((row, y) =>
              row.map((cell, x) => (
                <div key={`${x}-${y}`} className="w-9 h-9">
                  {renderCell(cell)}
                </div>
              )),
            )}
          </div>

          {/* Particle effects */}
          {particleEffects.length > 0 && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              {particleEffects.map((effect) => (
                <ParticleEffect
                  key={effect.id}
                  x={effect.x}
                  y={effect.y}
                  color={effect.color}
                  count={effect.count}
                  duration={400} // Shorter duration for all effects
                  onComplete={() => handleParticleComplete(effect.id)}
                />
              ))}
            </div>
          )}

          {/* Game over overlay */}
          {(gameOver || isPaused) && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="text-center p-4">
                {gameOver ? (
                  <p className="text-xl font-bold text-tetris-red">Game Over</p>
                ) : (
                  <>
                    <p className="text-xl font-bold mb-4">Paused</p>
                    <Button onClick={() => setIsPaused(false)}>Resume</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-auto">
          {/* Game info */}
          <div className="text-sm space-y-2">
            <div>
              <p className="font-medium">
                Score: <span className="text-tetris-red font-bold">{currentScore}</span>
              </p>
            </div>
            <div>
              <p className="font-medium">
                Level: <span className="text-tetris-turquoise font-bold">{level}</span>
              </p>
            </div>
            <div>
              <p className="font-medium">Rows: {rowsCleared}</p>
            </div>

            {!gameOver && !isPaused && player && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-tetris-turquoise text-tetris-turquoise hover:bg-tetris-turquoise/10"
                onClick={() => setIsPaused(true)}
              >
                Pause
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

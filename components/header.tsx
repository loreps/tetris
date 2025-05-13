import Link from "next/link"
import UserNameDialog from "./user-name-dialog"
import ColorSchemeSelector from "./color-scheme-selector"
import BoardThemeSelector from "./board-theme-selector"

export default function Header() {
  return (
    <header className="border-b border-tetris-turquoise/30 bg-gradient-to-r from-tetris-turquoise/10 to-tetris-red/10">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl text-tetris-turquoise">
          Linera Tetris
        </Link>
        <div className="flex items-center gap-2">
          <BoardThemeSelector />
          <ColorSchemeSelector />
          <UserNameDialog />
        </div>
      </div>
    </header>
  )
}

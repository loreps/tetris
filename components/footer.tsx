export default function Footer() {
  return (
    <footer className="border-t border-tetris-turquoise/30 bg-gradient-to-r from-tetris-red/10 to-tetris-turquoise/10 py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Linera Tetris. All rights reserved.
        </p>
        <p className="text-center text-sm leading-loose text-tetris-red md:text-right">Created with love on Linera</p>
      </div>
    </footer>
  )
}

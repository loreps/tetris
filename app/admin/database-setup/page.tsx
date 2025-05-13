import DatabaseSetup from "@/components/database-setup"

export default function DatabaseSetupPage() {
  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold text-center mb-8">Linera Tetris Database Setup</h1>
      <DatabaseSetup />
    </div>
  )
}

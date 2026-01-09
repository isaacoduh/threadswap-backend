import express from 'express'

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

const port = Number(process.env.PORT ?? 8000)

app.listen(port, () => {
  console.log(`[threadswap-backend-api] listening on :${port}`)
})

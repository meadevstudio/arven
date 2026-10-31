import { defineConfig } from 'vite'
import usdTryHandler from './api/usd-try.js'

const localExchangeRateApi = () => ({
  name: 'arven-exchange-rate-api',
  configureServer(server) {
    server.middlewares.use('/api/usd-try', usdTryHandler)
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api/usd-try', usdTryHandler)
  }
})

export default defineConfig({ plugins: [localExchangeRateApi()] })

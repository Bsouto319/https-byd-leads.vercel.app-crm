const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL

export async function sendWebhook(lead) {
  if (!WEBHOOK_URL) return

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_lead',
        source: 'byd_exposicao',
        timestamp: new Date().toISOString(),
        lead,
      }),
    })
  } catch (err) {
    console.error('Webhook error:', err)
  }
}

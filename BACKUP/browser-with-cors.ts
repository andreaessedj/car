// deno-lint-ignore no-explicit-any
// @ts-ignore
// Queste dichiarazioni evitano errori in locale/IDE, ma sono ignorate su Supabase Edge Functions
declare const Deno: any;

import { corsHeaders } from './_shared/cors.ts'

console.log(`Function "browser-with-cors" up and running!`)

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { name } = await req.json()
    const data = {
      message: `Hello ${name}!`,
    }
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

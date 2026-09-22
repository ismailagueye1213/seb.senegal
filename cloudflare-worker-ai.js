// Backend Cloudflare Worker pour le chatbot IA SEB
// 1. Créez un Worker Cloudflare.
// 2. Ajoutez la variable secrète OPENAI_API_KEY dans Settings > Variables and Secrets.
// 3. Déployez ce code.
// 4. Utilisez l'URL du Worker comme endpoint du chatbot du site.

const SYSTEM_PROMPT = `Tu es l'assistant officiel de Sénégal Énergie & Bâtiment (SEB), au Sénégal.
Réponds en français, de manière professionnelle, simple et concise.
SEB propose notamment : construction de bâtiments, rénovation, peinture, électricité et solutions énergétiques/solaires.
Ne donne jamais de prix inventé. Pour un prix, demande les informations nécessaires et propose le formulaire de devis.
Téléphone / WhatsApp SEB : +221 75 331 81 27.
Email : gueyeisma1213@gmail.com.
Localisation : Kaolack, Sénégal.
Si une demande nécessite une intervention humaine ou un devis précis, oriente vers WhatsApp ou le formulaire de devis.`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
        status: 405,
        headers: corsHeaders()
      });
    }

    try {
      const body = await request.json();
      const message = String(body.message || '').trim();

      if (!message) {
        return new Response(JSON.stringify({ error: 'Message vide' }), {
          status: 400,
          headers: corsHeaders()
        });
      }

      if (!env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY non configurée' }), {
          status: 500,
          headers: corsHeaders()
        });
      }

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          instructions: SYSTEM_PROMPT,
          input: message,
          max_output_tokens: 350
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Erreur du service IA' }), {
          status: 502,
          headers: corsHeaders()
        });
      }

      const answer = data.output_text || 'Je n’ai pas pu générer une réponse. Contactez SEB sur WhatsApp.';
      return new Response(JSON.stringify({ answer }), {
        status: 200,
        headers: corsHeaders()
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
};

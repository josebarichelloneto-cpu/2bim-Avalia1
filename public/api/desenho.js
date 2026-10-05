import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

function resposta(status, texto) {
  return new Response(texto, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function onRequest({ request, env }) {
  // 1. Metodo -> 405
  if (request.method !== "POST") {
    return new Response("Metodo nao permitido.", {
      status: 405,
      headers: { "Allow": "POST", "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 2. Corpo -> 400
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta(400, "Corpo ausente ou JSON invalido.");
  }
  if (corpo === null || typeof corpo !== "object" || !numeroValido(corpo.numero)) {
    return resposta(400, "O campo numero deve ser um inteiro entre 1 e 100.");
  }

  // 3. Token -> 401
  const cabecalho = request.headers.get("Authorization") || "";
  const partes = cabecalho.match(/^Bearer\s+(.+)$/i);
  if (!partes) {
    return resposta(401, "Token ausente.");
  }
  const token = partes[1].trim();

  let dados;
  try {
    const verificacao = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token)
    );
    if (verificacao.status !== 200) {
      return resposta(401, "Token invalido ou expirado.");
    }
    dados = await verificacao.json();
  } catch {
    return resposta(401, "Nao foi possivel verificar o token.");
  }

  if (!env.GOOGLE_CLIENT_ID || dados.aud !== env.GOOGLE_CLIENT_ID) {
    return resposta(401, "Token emitido para outro cliente.");
  }
  if (dados.email_verified !== "true" || !dados.email) {
    return resposta(401, "E-mail nao verificado.");
  }

  // 4. Sucesso -> 200, assinado com o e-mail vindo do token
  const svg = gerarDesenho(corpo.numero, dados.email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" },
  });
}

// script.js
// O navegador faz o login com o Google, envia o numero e o token ao servidor
// e exibe o SVG recebido. O desenho nao e mais calculado aqui.

const CLIENT_ID = "308449127901-1uia9bl96uibfcppuf2qgvk6pg5ic6ht.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const usuario = document.getElementById("usuario");
const botaoBaixar = document.getElementById("baixar");

let idToken = null;
let svgAtual = "";

function inteiroValido(n) {
  return Number.isInteger(n) && n >= 1 && n <= 100;
}

window.addEventListener("load", () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resposta) => {
      idToken = resposta.credential;
      usuario.textContent = "Login com Google realizado.";
      mensagem.textContent = "";
    },
  });
  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    { theme: "outline", size: "large" }
  );
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  const numero = Number(campoNumero.value);
  if (!inteiroValido(numero)) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (idToken || ""),
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: requisição inválida. Informe um inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: não autorizado. Entre com sua conta Google e tente de novo.";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Erro inesperado (" + resposta.status + ").";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (erro) {
    mensagem.textContent = "Não foi possível falar com o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});

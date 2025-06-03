const corpoTabelaExtrato = document.getElementById('corpoTabelaExtrato');
const formAdicionar = document.getElementById('formAdicionar');
const inputDescricao = document.getElementById('descricao');
const inputValor = document.getElementById('valor');
const selectTipo = document.getElementById('tipo');
const spanTotalEntradas = document.getElementById('total-entradas');
const spanTotalSaidas = document.getElementById('total-saidas');
const spanSaldoTotal = document.getElementById('saldo-total');
const modal = document.getElementById('modalEditarExcluir');
const modalFecharBtn = document.getElementById('modalFechar');
const formModalEditar = document.getElementById('formModalEditar');
const modalTransacaoIdInput = document.getElementById('modalTransacaoId');
const modalDescricaoInput = document.getElementById('modalDescricao');
const modalValorInput = document.getElementById('modalValor');
const modalTipoSelect = document.getElementById('modalTipo');
const btnCancelarModal = document.getElementById('btnCancelarModal');
const canvasGrafico = document.getElementById('graficoEntradasSaidas');

let meuGrafico = null;


const API_URL = 'http://localhost:3333/transacoes';
let transacoesAtuais = [];

function formatarMoeda(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function renderizarGrafico(totalEntradasNum, totalSaidasNum) {
  const ctx = canvasGrafico.getContext('2d');

  if (meuGrafico) {
    meuGrafico.destroy(); // Destrói o gráfico anterior para evitar sobreposição
  }

  meuGrafico = new Chart(ctx, {
    type: 'bar', // Tipo de gráfico
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        label: 'Valor (R$)',
        data: [totalEntradasNum, totalSaidasNum],
        backgroundColor: [
          'rgba(51, 255, 51, 0.7)',  // Cor para Entradas (verde)
          'rgba(255, 68, 68, 0.7)'   // Cor para Saídas (vermelho)
        ],
        borderColor: [
          'rgba(51, 255, 51, 1)',
          'rgba(255, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Permite controlar melhor a altura via CSS
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#00FF00', // Cor dos ticks (valores) do eixo Y
            font: {
                family: "'Courier New', monospace"
            }
          },
          grid: {
            color: 'rgba(0, 255, 0, 0.2)' // Cor das linhas de grade do eixo Y
          }
        },
        x: {
          ticks: {
            color: '#00FF00', // Cor dos labels (Entradas/Saídas) do eixo X
            font: {
                family: "'Courier New', monospace",
                size: 14
            }
          },
           grid: {
            display: false // Remove linhas de grade do eixo X para um visual mais limpo
          }
        }
      },
      plugins: {
        legend: {
          display: false // Não mostrar legenda, pois já temos os labels no eixo X
        },
        tooltip: {
            bodyFont: {
                family: "'Courier New', monospace"
            },
            titleFont: {
                family: "'Courier New', monospace"
            },
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += formatarMoeda(context.parsed.y);
                    }
                    return label;
                }
            }
        }
      }
    }
  });
}

function calcularERenderizarResumo(transacoes) {
  let totalEntradas = 0;
  let totalSaidas = 0;
  transacoes.forEach(transacao => {
    if (transacao.tipo === 'entrada') {
      totalEntradas += transacao.valor;
    } else if (transacao.tipo === 'saida') {
      totalSaidas += transacao.valor;
    }
  });
  const saldoTotal = totalEntradas - totalSaidas;
  spanTotalEntradas.textContent = formatarMoeda(totalEntradas);
  spanTotalSaidas.textContent = formatarMoeda(totalSaidas);
  spanSaldoTotal.textContent = formatarMoeda(saldoTotal);
  spanSaldoTotal.classList.remove('positivo', 'negativo', 'zero');
  if (saldoTotal > 0) spanSaldoTotal.classList.add('positivo');
  else if (saldoTotal < 0) spanSaldoTotal.classList.add('negativo');
  else spanSaldoTotal.classList.add('zero');

  renderizarGrafico(totalEntradas, totalSaidas); // Chama a função do gráfico aqui
}

function abrirModalParaEdicao(transacaoId) {
  const transacao = transacoesAtuais.find(t => t.id === transacaoId);
  if (!transacao) return;
  modalTransacaoIdInput.value = transacao.id;
  modalDescricaoInput.value = transacao.descricao;
  modalValorInput.value = transacao.valor.toFixed(2);
  modalTipoSelect.value = transacao.tipo;
  modal.style.display = 'block';
}

function fecharModal() {
  modal.style.display = 'none';
  formModalEditar.reset();
}

function renderizarTabela(transacoes) {
  corpoTabelaExtrato.innerHTML = '';
  transacoesAtuais = transacoes;
  if (transacoes.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = 'Nenhuma transação encontrada.';
    td.style.textAlign = 'center';
    tr.appendChild(td);
    corpoTabelaExtrato.appendChild(tr);
    calcularERenderizarResumo([]);
    return;
  }
  transacoes.forEach(transacao => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => abrirModalParaEdicao(transacao.id));
    const tdDescricao = document.createElement('td');
    tdDescricao.textContent = transacao.descricao;
    const tdValor = document.createElement('td');
    tdValor.textContent = formatarMoeda(transacao.valor);
    tdValor.style.textAlign = 'right';
    const tdTipo = document.createElement('td');
    tdTipo.textContent = transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1);
    tdTipo.classList.add(transacao.tipo === 'entrada' ? 'tipo-entrada' : 'tipo-saida');
    tr.appendChild(tdDescricao);
    tr.appendChild(tdValor);
    tr.appendChild(tdTipo);
    corpoTabelaExtrato.appendChild(tr);
  });
  calcularERenderizarResumo(transacoes);
}

async function buscarTransacoes() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
    const transacoes = await response.json();
    renderizarTabela(transacoes);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    corpoTabelaExtrato.innerHTML = `<tr><td colspan="3" style="color: red; text-align: center;">Erro ao carregar dados. Backend está rodando?</td></tr>`;
    calcularERenderizarResumo([]);
  }
}

async function adicionarTransacao(event) {
  event.preventDefault();
  const descricao = inputDescricao.value.trim();
  const valor = parseFloat(inputValor.value);
  const tipo = selectTipo.value;
  if (!descricao || isNaN(valor) || valor <= 0) {
    alert('Por favor, preencha a descrição e um valor válido.');
    return;
  }
  const novaTransacao = { descricao, valor, tipo };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaTransacao)
    });
    if (!response.ok) {
      const erroData = await response.json();
      throw new Error(erroData.mensagem || `Erro HTTP! status: ${response.status}`);
    }
    formAdicionar.reset();
    buscarTransacoes();
  } catch (error) {
    console.error("Erro ao adicionar transação:", error);
    alert(`Erro ao adicionar transação: ${error.message}`);
  }
}

async function salvarAlteracoesModal(event) {
  event.preventDefault();
  const id = modalTransacaoIdInput.value;
  const descricao = modalDescricaoInput.value.trim();
  const valor = parseFloat(modalValorInput.value);
  const tipo = modalTipoSelect.value;
  if (!descricao || isNaN(valor) || valor <= 0) {
    alert('Por favor, preencha todos os campos do modal com valores válidos.');
    return;
  }
  const transacaoAtualizada = { descricao, valor, tipo };
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transacaoAtualizada)
    });
    if (!response.ok) {
      const erroData = await response.json();
      throw new Error(erroData.mensagem || `Erro HTTP! status: ${response.status}`);
    }
    fecharModal();
    buscarTransacoes();
  } catch (error) {
    console.error("Erro ao salvar alterações:", error);
    alert(`Erro ao salvar alterações: ${error.message}`);
  }
}

async function excluirTransacaoModal() {
  const id = modalTransacaoIdInput.value;
  if (!confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) {
    return;
  }
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      const erroData = await response.json().catch(() => null);
      throw new Error(erroData?.mensagem || `Erro HTTP! status: ${response.status}`);
    }
    fecharModal();
    buscarTransacoes();
  } catch (error)
{
    console.error("Erro ao excluir transação:", error);
    alert(`Erro ao excluir transação: ${error.message}`);
  }
}

formAdicionar.addEventListener('submit', adicionarTransacao);
formModalEditar.addEventListener('submit', salvarAlteracoesModal);
document.getElementById('btnExcluirModal').addEventListener('click', excluirTransacaoModal); // Garante que o listener está no botão certo
modalFecharBtn.addEventListener('click', fecharModal);
btnCancelarModal.addEventListener('click', fecharModal);

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    fecharModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  buscarTransacoes();
});
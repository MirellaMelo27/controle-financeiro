const express = require('express'); //  CRIA SERVIDOR
const cors = require('cors'); // FAZ REQUISIÇÕES DE QUALQUER LUGAR
const app = express(); // CRIA INSTANCIA DO APLICATIVO
const PORT = 3333; // DEFINE A PORTA 

app.use(cors()); // USA O CORS NA INSTANCIA DO APLICATIVO
app.use(express.json()); // DEFINE O TIPO DE DADOS

// ARMAZENA TEMPORARIAMENTE AS TRANSAÇÕES
let transacoes = [
];
let proximoId = 1;

app.get('/transacoes', (req, res) => {
  res.json(transacoes);
});


// CRIA UMA NOVA TRANSAÇÃO
app.post('/transacoes', (req, res) => {
  const { descricao, valor, tipo } = req.body;

  if (!descricao || valor === undefined || !tipo) {
    return res.status(400).json({ mensagem: "Descrição, valor e tipo são obrigatórios." });
  }
  if (typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ mensagem: "O valor deve ser um número positivo." });
  }
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return res.status(400).json({ mensagem: "O tipo deve ser 'entrada' ou 'saida'." });
  }

  const novaTransacao = {
    id: proximoId++,
    descricao: descricao,
    valor: parseFloat(valor),
    tipo: tipo,
    data: new Date()
  };

  transacoes.push(novaTransacao);
  res.status(201).json(novaTransacao);
});

// EDITAR UMA TRANSAÇÃO
app.put('/transacoes/:id', (req, res) => {
  const idParaEditar = parseInt(req.params.id);
  const { descricao, valor, tipo } = req.body;

  if (!descricao || valor === undefined || !tipo) {
    return res.status(400).json({ mensagem: "Descrição, valor e tipo são obrigatórios para edição." });
  }
  if (typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ mensagem: "O valor deve ser um número positivo." });
  }
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return res.status(400).json({ mensagem: "O tipo deve ser 'entrada' ou 'saida'." });
  }

  const indexTransacao = transacoes.findIndex(t => t.id === idParaEditar);

  if (indexTransacao === -1) {
    return res.status(404).json({ mensagem: "Transação não encontrada." });
  }

  transacoes[indexTransacao] = {
    ...transacoes[indexTransacao],
    descricao: descricao,
    valor: parseFloat(valor),
    tipo: tipo
  };

  res.json(transacoes[indexTransacao]);
});

// DELETAR UMA TRANSAÇÃO
app.delete('/transacoes/:id', (req, res) => {
  const idParaDeletar = parseInt(req.params.id);
  const indexTransacao = transacoes.findIndex(t => t.id === idParaDeletar);

  if (indexTransacao === -1) {
    return res.status(404).json({ mensagem: "Transação não encontrada." });
  }

  transacoes.splice(indexTransacao, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
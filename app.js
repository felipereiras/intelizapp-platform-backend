const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API da Plataforma de Gestão de WhatsApp!' });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

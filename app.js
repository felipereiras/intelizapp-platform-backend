// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelos
const Contact = mongoose.model('Contact', {
  name: String,
  phone: String,
  city: String,
  state: String,
  birthday: Date,
  email: String,
  tags: [String]
});

const Campaign = mongoose.model('Campaign', {
  name: String,
  message: String,
  tags: [String],
  status: String
});

// Configuração do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth()
});

let qr = '';

client.on('qr', (qrCode) => {
  qr = qrCode;
  console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
  console.log('Client is ready!');
});

client.initialize();

// Rotas
app.get('/qr', async (req, res) => {
  if (qr) {
    const qrImage = await qrcode.toDataURL(qr);
    res.send(`<img src="${qrImage}" />`);
  } else {
    res.send('QR code not generated yet');
  }
});

app.post('/send-message', async (req, res) => {
  const { number, message } = req.body;
  try {
    const msg = await client.sendMessage(`${number}@c.us`, message);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

app.post('/contacts', async (req, res) => {
  const contact = new Contact(req.body);
  await contact.save();
  res.json({ success: true, contact });
});

app.get('/contacts', async (req, res) => {
  const contacts = await Contact.find();
  res.json(contacts);
});

app.post('/campaigns', async (req, res) => {
  const campaign = new Campaign(req.body);
  await campaign.save();
  res.json({ success: true, campaign });
});

app.get('/campaigns', async (req, res) => {
  const campaigns = await Campaign.find();
  res.json(campaigns);
});

app.post('/execute-campaign', async (req, res) => {
  const { campaignId } = req.body;
  const campaign = await Campaign.findById(campaignId);
  const contacts = await Contact.find({ tags: { $in: campaign.tags } });

  for (let contact of contacts) {
    await client.sendMessage(`${contact.phone}@c.us`, campaign.message);
  }

  campaign.status = 'Executed';
  await campaign.save();

  res.json({ success: true, message: 'Campaign executed successfully' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

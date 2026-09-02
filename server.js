import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Royal Paws server is running.'
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof message !== 'string'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your name, email, and message.'
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
  const cleanMessage = message.trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (cleanName.length > 100 || cleanEmail.length > 150 || cleanPhone.length > 30 || cleanMessage.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'One or more fields are too long.'
    });
  }

  console.log('New Royal Paws contact message:', {
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    message: cleanMessage
  });

  return res.status(200).json({
    success: true,
    message: `Thank you, ${cleanName}. Your message has been received.`
  });
});

app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  next();
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`Royal Paws server running on port ${PORT}`);
});

const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  console.log('Received a request for the root path');
  res.send(`
    <html>
      <body>
        <h1>Welcome to ${process.env.APP_NAME || 'My App'}</h1>
        <p>Version: ${process.env.APP_VERSION || '3.1.0'}</p>
        <p>Environment: ${process.env.ENVIRONMENT || 'development'}</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
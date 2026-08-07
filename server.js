const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic Port Binding with local fallback
const PORT = process.env.PORT || 3000;

// In-Memory State Management
let switchState = 'OFF';

// ----------------------------------------------------
// 1. Web UI Dashboard
// ----------------------------------------------------
app.get('/', (req, res) => {
  const isOn = switchState === 'ON';
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cloud Smart Switch Dashboard</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f7f6;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          text-align: center;
          width: 300px;
        }
        .status {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0;
          color: ${isOn ? '#2ecc71' : '#e74c3c'};
        }
        button {
          padding: 12px 24px;
          font-size: 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: white;
          background-color: ${isOn ? '#e74c3c' : '#2ecc71'};
          transition: background 0.3s;
        }
        button:hover {
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Smart Switch</h2>
        <div class="status">State: ${switchState}</div>
        <form action="/toggle" method="POST">
          <button type="submit">Turn ${isOn ? 'OFF' : 'ON'}</button>
        </form>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// ----------------------------------------------------
// 2. Status Polling
// ----------------------------------------------------
app.get('/status', (req, res) => {
  res.json({ state: switchState });
});

// ----------------------------------------------------
// 3. Dashboard Toggle
// ----------------------------------------------------
app.post('/toggle', (req, res) => {
  switchState = switchState === 'ON' ? 'OFF' : 'ON';
  res.redirect('/');
});

// ----------------------------------------------------
// 4. Hardware Update
// ----------------------------------------------------
app.post('/update', (req, res) => {
  const { state } = req.body;
  if (state === 'ON' || state === 'OFF') {
    switchState = state;
    return res.json({ status: 'success', state: switchState });
  }
  res.status(400).json({ error: 'Invalid state provided. Use ON or OFF.' });
});

// ----------------------------------------------------
// 5. OAuth Authorization (Google Home Linking)
// ----------------------------------------------------
app.get('/oauth/authorize', (req, res) => {
  const redirectUri = req.query.redirect_uri;
  const state = req.query.state;
  
  const authHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Authorize Google Home</title></head>
    <body style="font-family: Arial; text-align: center; padding-top: 50px;">
      <h2>Link Smart Switch with Google Home</h2>
      <form action="/oauth/authorize" method="POST">
        <input type="hidden" name="redirect_uri" value="${redirectUri}">
        <input type="hidden" name="state" value="${state}">
        <button type="submit" style="padding: 10px 20px; font-size: 16px;">Authorize Link</button>
      </form>
    </body>
    </html>
  `;
  res.send(authHtml);
});

app.post('/oauth/authorize', (req, res) => {
  const { redirect_uri, state } = req.body;
  const authCode = 'mock_auth_code_12345';
  res.redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
});

// ----------------------------------------------------
// 6. OAuth Token Exchange
// ----------------------------------------------------
app.post('/oauth/token', (req, res) => {
  res.json({
    token_type: 'Bearer',
    access_token: 'mock_access_token_abc123',
    refresh_token: 'mock_refresh_token_xyz789',
    expires_in: 3600
  });
});

// ----------------------------------------------------
// 7. Google Fulfillment
// ----------------------------------------------------
app.post('/google-fulfillment', (req, res) => {
  const { requestId, inputs } = req.body;
  const intent = inputs[0].intent;

  if (intent === 'action.devices.SYNC') {
    return res.json({
      requestId: requestId,
      payload: {
        agentUserId: 'user_12345',
        devices: [
          {
            id: 'smart-switch-1',
            type: 'action.devices.types.SWITCH',
            traits: ['action.devices.traits.OnOff'],
            name: { name: 'Cloud Smart Switch' },
            willReportState: false
          }
        ]
      }
    });
  }

  if (intent === 'action.devices.QUERY') {
    return res.json({
      requestId: requestId,
      payload: {
        devices: {
          'smart-switch-1': {
            on: switchState === 'ON',
            online: true
          }
        }
      }
    });
  }

  if (intent === 'action.devices.EXECUTE') {
    const commands = inputs[0].payload.commands;
    const execution = commands[0].execution[0];

    if (execution.command === 'action.devices.commands.OnOff') {
      switchState = execution.params.on ? 'ON' : 'OFF';
    }

    return res.json({
      requestId: requestId,
      payload: {
        commands: [
          {
            ids: ['smart-switch-1'],
            status: 'SUCCESS',
            states: {
              on: switchState === 'ON',
              online: true
            }
          }
        ]
      }
    });
  }

  res.status(400).send('Unsupported Intent');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

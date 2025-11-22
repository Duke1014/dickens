import React from 'react';

const REACT_ENV_KEYS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_MEASUREMENT_ID',
];

function mask(value?: string) {
  if (!value) return 'MISSING';
  if (value.length <= 6) return '*****';
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

export default function EnvCheck() {
  const rows = REACT_ENV_KEYS.map((key) => {
    // Access via process.env so CRA exposes REACT_APP_* variables
    const raw = process.env[key as keyof NodeJS.ProcessEnv] as string | undefined;
    return (
      <tr key={key}>
        <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>{key}</td>
        <td style={{ padding: '6px 12px' }}>{raw ? 'present' : 'missing'}</td>
        <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>{mask(raw)}</td>
      </tr>
    );
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Environment variables check (development only)</h2>
      <p>
        This page shows whether key REACT_APP_ variables are present in the running environment. Values are
        masked for safety. Do not use this page in production.
      </p>
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 12px' }}>Variable</th>
            <th style={{ textAlign: 'left', padding: '6px 12px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '6px 12px' }}>Masked value</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

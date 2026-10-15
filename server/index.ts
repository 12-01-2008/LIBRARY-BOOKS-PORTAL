import path from 'path';
import express from 'express';
import { app } from './app.ts';

const PORT = process.env.PORT || 3000;

// In production, serve the built Vite static assets
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🏛️ Smart Library Portal server listening on port ${PORT}`);
});

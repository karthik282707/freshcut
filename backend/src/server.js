import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🥩 FreshCut Connect Backend running on http://localhost:${PORT}`);
    console.log(`   API Health: http://localhost:${PORT}/api/health`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

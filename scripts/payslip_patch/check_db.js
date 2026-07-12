require('dotenv').config();
const url = process.env.DATABASE_URL1 || process.env.DATABASE_URL;
console.log('Variable trouvée:', !!url);
console.log('Host (masqué):', url ? url.replace(/:\/\/[^@]+@/, '://****@') : 'AUCUNE');

require("dotenv").config();

const express = require('express');
const cors = require('cors');
const badgeRoutes = require('./routes/badgeRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*' }));

app.use(express.json({ limit: '35MB' }));

app.use('/', badgeRoutes);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

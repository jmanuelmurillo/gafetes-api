require("dotenv").config();

const express = require('express');
const cors = require('cors');
const badgeRoutes = require('./routes/badgeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));

app.use(express.json({ limit: '35MB' }));

app.use('/badges', badgeRoutes);

app.get('/', (_req, res) => {
	res.send('Hello World!');
});


app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

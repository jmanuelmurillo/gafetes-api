require("dotenv").config();

const express = require('express');
const badgeRoutes = require('./routes/badgeRoutes');
var fs = require('fs');

const app = express();
const PORT = process.env.PORT;

app.use(express.json({ limit: '35MB' }));
app.use('/api/badges', badgeRoutes);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

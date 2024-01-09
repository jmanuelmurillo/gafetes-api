const express = require('express');
const badgeRoutes = require('./routes/badgeRoutes');
var fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '35MB' }));
app.use('/api/badges', badgeRoutes);

app.post('/image', (req, res) => {
	const { body } = req;

	if (body.image != null) {
		var data = body.image.split(',')[1];
		var buf = Buffer.from(data,'base64');
		fs.writeFileSync('./secondDemo.png', buf);
	}

	res.send('ok');
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});


import express from 'express'
const app = express()

app.get('/time', (req, res, next) => {
	setTimeout(function() {
		res.end('' + (new Date().getTime()))

	}, 10000)
})
 
app.listen(3001)
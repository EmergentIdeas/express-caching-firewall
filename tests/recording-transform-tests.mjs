import test from 'node:test'
import assert from 'node:assert'

import { Readable } from 'node:stream'

import RecordingTransform from '../utils/recording-transform.mjs'
import wait from '../utils/wait.mjs'
import DeadStream from '../utils/dead-stream.mjs'

test('simple recording', async (t) => {
	let response = await fetch('https://www.spam.com')
	let recorder = new RecordingTransform()
	Readable.fromWeb(response.body).pipe(recorder).pipe(new DeadStream())
	

	assert.equal(1, 1)
	recorder.on('end', () => {
		assert(recorder.byteCount > 0)
		assert(recorder.overflow == false)
		console.log(`content size: ${recorder.byteCount}`)

	})
	

	await wait(2000)
})

test('too big recording', async (t) => {
	let response = await fetch('https://www.spam.com')
	let recorder = new RecordingTransform({
		maxSize: 100
	})
	Readable.fromWeb(response.body).pipe(recorder).pipe(new DeadStream())
	

	assert.equal(1, 1)
	recorder.on('end', () => {
		assert(recorder.byteCount > 0)
		assert(recorder.overflow == true)
		console.log(`byte count: ${recorder.byteCount}`)

	})
	

	await wait(2000)
})
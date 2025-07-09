import test from 'node:test'
import assert from 'node:assert'

import { Readable } from 'node:stream'

import RecordingTransform from '../utils/recording-transform.mjs'
import wait from '../utils/wait.mjs'
import DeadStream from '../utils/dead-stream.mjs'

test('simple recording', async (t) => {
	let response = await fetch('https://www.spam.com')
	let recorder = new RecordingTransform()
	
	// Transform the fetch style stream to the node style stream and pipe it
	// to nowhere
	Readable.fromWeb(response.body).pipe(recorder).pipe(new DeadStream())
	

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
	
	// Transform the fetch style stream to the node style stream and pipe it
	// to nowhere
	Readable.fromWeb(response.body).pipe(recorder).pipe(new DeadStream())
	

	recorder.on('end', () => {
		assert(recorder.byteCount > 0)
		assert(recorder.overflow == true)
		console.log(`byte count: ${recorder.byteCount}`)

	})
	

	await wait(2000)
})
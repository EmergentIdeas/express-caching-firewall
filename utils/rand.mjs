import crypto from 'crypto'

export default function rand() {
	return crypto.randomBytes(32).toString("base64url");
}


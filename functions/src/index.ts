const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const { createHmac } = require('node:crypto');

const ZOOM_API_KEY = 'ge4T8R7SMeLfxV001nag';
const ZOOM_API_SECRET = 'lgHimRvmBTUljyY8tzB3gORwLo7yADOD';

exports.generateZoomSignature = functions.https.onRequest((req: any, res: any) => {
    cors(req, res, () => {
        const meetingNumber = req.query.meetingNumber;
        const role = req.query.role;

        if (!meetingNumber || role === undefined) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const timestamp = new Date().getTime() - 30000;
        const msg = Buffer.from(`${ZOOM_API_KEY}${meetingNumber}${timestamp}${role}`).toString('base64');

        const hash = createHmac('sha256', ZOOM_API_SECRET).update(msg).digest('base64');

        const rawSignature = `${ZOOM_API_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`;
        const signature = Buffer.from(rawSignature).toString('base64').replace(/=+$/, '');

        res.json({ signature });
    });
});

exports.getZoomAccessToken = functions.https.onRequest((req: any, res: any) => {
    cors(req, res, async () => {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        const clientId = functions.config().zoom.clientid;
        const clientSecret = functions.config().zoom.clientsecret;
        const redirectUri = 'https://oauth.pstmn.io/v1/callback'; // Must match Zoom app config

        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const response = await axios.post(
                'https://zoom.us/oauth/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri
                }),
                {
                    headers: {
                        Authorization: `Basic ${basicAuth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            res.status(200).json({
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_in: response.data.expires_in
            });
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error:', error.response?.data || error.message);
                res.status(500).json({ error: error.response?.data || error.message });
            } else if (error instanceof Error) {
                console.error('Unexpected error:', error.message);
                res.status(500).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Unknown error occurred' });
            }
        }
    });
});

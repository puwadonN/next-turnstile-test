import isValidEmail, { emailRegex } from '@/lib/isValidEmail';
import Joi from 'joi';

export const runtime = "edge"

const reqBodySchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string()
		.custom((value, helpers) => {
			if (!isValidEmail(value)) {
				return helpers.message('Invalid email address');
			}
			return value;
		})
		.required(),
	subject: Joi.string().required(),
	message: Joi.string().required(),
	turnstileToken: Joi.string().required(),
	acceptTerms: Joi.boolean()
		.custom((value, helpers) => {
			if (!value) {
				return helpers.message(
					'You did not accept our terms and privacy policy'
				);
			}
			return value;
		})
		.required(),
});

const TURNSTILE_SECRET_KEY = "0x4AAAAAAAcsSw6HjCTRNMc4JuoSQCtGaDY";
const TURNSTILE_VERIFY_URL =
	'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default async function handler(req) {
	console.log(`call api`)
	if (req.method === 'POST') {
		const reqBody = await req.json();
		// console.log(`reqBody `, reqBody)
		// reqBody.turnstileToken = "0.i8G_igGWWopLMMNiOyWHN5BkmaNCV2Dx28UeC8KAaeXOh9-yaF2R3uFhNf87xV8_bJff5dt51yG2i5XJSTk33L7RGgfuF7S9SFdfN4wneAy_2jtyR-NNhqkAUI0_njHsi5OgKBGyZY1_wEy1iupbxUY8e8UDaeI4r1gWaLXAa8PaGgklNzvtjTQiIf9kYmMtC9cAKC4osrYFQBCDcS6PzRtjbKISEszWUUgUkAWL0KlyWjMFljHb4rYJUqf0WgRmdrn0_-BQy-3QPrKiIiZZtGgcGrtknbxKQvtBNJJ18hyLcKSXdcLP03FVUFy4ZfxLXspxHBQjdlgsmH6T_cdJ6bJflJJwVaJ9g3LnSTiNuQsSXY7GC_kbREToYFw7_aVYiKVE4qqIUJKawBqA447h1jjDZWG6Lucj8baJV_bRiaQvep50E27YTtyvpFsgdqt4vi0IrJHwKNW798waPuVex1dbaNucvtyGtqwBaoKeDIc.zT8XkWSivqVfz7S3cx8mNw.d111a9998e14086ae0f668dfeb820262b25bce1c62ea6611e168cc9de16ca312"
		// nodeLog(typeof reqBody === 'object' && reqBody instanceof Object);
		// nodeLog(req.body instanceof {})
		if (typeof reqBody === 'object' && reqBody instanceof Object) {
			try {
				// const _ = await reqBodySchema.validateAsync(reqBody);
				//by now we have validated the body of the request
				const { name, email, subject, message, turnstileToken } =
					reqBody;
				//verify the token
				try {
					const bodyData = `secret=${encodeURIComponent(
						TURNSTILE_SECRET_KEY
					)}&response=${encodeURIComponent(turnstileToken)}`;

					const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
						method: 'POST',
						body: bodyData,
						headers: {
							'content-type': 'application/x-www-form-urlencoded',
						},
					});
					// console.log(`verifyResponse: `, verifyResponse)
					// console.log(`verifyResponse.ok`,verifyResponse.ok)
					if (verifyResponse.ok) {
						//get the data from the body of the request
						const verifyData = await verifyResponse.json();
						return new Response(JSON.stringify(verifyData), {
							status: 200,
							headers: {
							  "message": "Form submission was successful~"
							},
						});
						//process the form data if the token verification success is true
						if (verifyData?.success) {
							//send the form data using email or save the submission to a database
							
							
						} else {
							//will be caught in the catch block with 403 status code
							throw new Error('Token verification failed2222');
						}
					} else {
						//will be caught in the catch block with 403 status code
						throw new Error('Token verification failed3333');
					}
				} catch (err) {
					return new Response(JSON.stringify(err), {
						status: 403,
						headers: {
						  "message": "Token verification failed~"
						},
					});
					return res.status(403).send({
						message: 'Token verification failed',
					});
				}
			} catch (err) {
				//transform the error before sending them in the response
				const transformedErrors = err?.details?.map(
					({ message, context }) => {
						return {
							errorMessage: message,
							context,
						};
					}
				);
				return new Response(JSON.stringify(err), {
					status: 403,
					headers: {
					  "message": "Invalid request data~",
					  errors: transformedErrors,
					},
				});
				return res.status(400).send({
					message: 'Invalid request data',
					errors: transformedErrors,
				});
			}
		} else {
			return new Response(JSON.stringify(err), {
				status: 400,
				headers: {
				  "message": "Missing body in request~",
				},
			});
			return res.status(400).send({
				message: 'Missing body in request',
			});
		}
	} else {
		return new Response(JSON.stringify(err), {
			status: 405,
			headers: {
			  "message": "Method not allowed~",
			},
		});
		return res.status(405).send({
			message: 'Method not allowed',
		});
	}
}

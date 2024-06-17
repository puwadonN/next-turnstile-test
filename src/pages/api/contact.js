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

const TURNSTILE_SECRET_KEY = "0x4AAAAAAAcqiPSpQq3gA9i2QNqVl0u6_JQ";
const TURNSTILE_VERIFY_URL =
	'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default async function handler(req) {
	if (req.method === 'POST') {
		const reqBody = await req.json();
		// nodeLog(typeof reqBody === 'object' && reqBody instanceof Object);
		// nodeLog(req.body instanceof {})
		if (typeof reqBody === 'object' && reqBody instanceof Object) {
			try {
				const _ = await reqBodySchema.validateAsync(reqBody);
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
					console.log(`verifyResponse: `, verifyResponse)
					if (verifyResponse.ok) {
						//get the data from the body of the request
						const verifyData = await verifyResponse.json();
						return new Response(JSON.stringify(req.body), {
							status: 200,
							headers: {
							  "message": "Form submission was successful~"
							},
						});
						//process the form data if the token verification success is true
						if (verifyData?.success) {
							//send the form data using email or save the submission to a database
							
							  
							return res.status(200).send({
								message: 'Form submission was successful',
							});
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

import { auth0 } from "../lib/auth0";

export default async function ConfirmationPage() {
	const session = await auth0.getSession();

	if (!session) {
		return (
			<main style={{ padding: "2rem" }}>
				<h1>Not signed in</h1>
				<p>No Auth0 session was found.</p>
				<a href="/auth/login">Sign In</a>
			</main>
		);
	}

	return (
		<main style={{ padding: "2rem" }}>
			<h1>Auth0 Confirmation</h1>

			<p style={{ color: "green", fontWeight: "bold" }}>
				Sign in / sign up worked successfully.
			</p>

			<h2>User Info</h2>
			<p>Email: {session.user.email}</p>
			<p>Name: {session.user.name}</p>
			<p>User ID: {session.user.sub}</p>

			<h2>Full Auth0 User Object</h2>
			<pre>{JSON.stringify(session.user, null, 2)}</pre>

			<a href="/auth/logout">Log Out</a>
		</main>
	);
}
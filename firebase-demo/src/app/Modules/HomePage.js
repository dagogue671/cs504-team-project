"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function HomePage() {
	const router = useRouter();

	return (
		<main style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem" }}>
			<h1>Welcome</h1>
			<div style={{ display: "flex", gap: "1rem" }}>
				<button type="button" onClick={() => router.push("/Modules/SignInForm")}>Sign In</button>
				<button type="button" onClick={() => router.push("/Modules/SignUpForm")}>Sign Up</button>
			</div>
		</main>
	);
}

"use client";

import React from "react";

export default function HomePage() {
	return (
		<main
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "1rem",
				padding: "2rem",
			}}
		>
			<h1>Welcome</h1>

			<div style={{ display: "flex", gap: "1rem" }}>
				<button
					type="button"
					onClick={() => {
						window.location.href =
							"/auth/login?returnTo=/confirmation";
					}}
				>
					Sign In
				</button>

				<button
					type="button"
					onClick={() => {
						window.location.href =
							"/auth/login?screen_hint=signup&returnTo=/confirmation";
					}}
				>
					Sign Up
				</button>
			</div>
		</main>
	);
}
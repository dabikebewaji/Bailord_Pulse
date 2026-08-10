import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Dev helper: if VITE_DEV_TOKEN is set, seed localStorage with a token so frontend requests
// include Authorization header during local development. Do NOT enable in production.
try {
	const devToken = import.meta.env.VITE_DEV_TOKEN as string | undefined;
	if (devToken && !localStorage.getItem('bailord_user') && !localStorage.getItem('bailord_user_logged_out')) {
		// Provide a minimal user object (id only) so auth guard sees an authenticated session.
		const devUser = { id: 4 };
		localStorage.setItem('bailord_user', JSON.stringify({ token: devToken, user: devUser }));
		console.info('Dev token seeded into localStorage (bailord_user)');
	}
} catch (e) {
	// ignore when running outside browser (SSR/test)
}

createRoot(document.getElementById("root")!).render(<App />);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import App from "./app.tsx";
import { ToastProvider } from "./components/toast.tsx";
import { CartProvider } from "./components/cart-context.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<Router>
				<CartProvider>
					<ToastProvider>
						<App />
					</ToastProvider>
				</CartProvider>
			</Router>
		</QueryClientProvider>
	</StrictMode>,
);

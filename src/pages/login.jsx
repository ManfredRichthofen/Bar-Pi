import React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import useConfigStore from "../store/configStore";
import logoFull from "../assets/logo-full.svg";
import backgroundS from "../assets/login/background_s.jpg";
import backgroundM from "../assets/login/background_m.jpg";
import backgroundL from "../assets/login/background_l.jpg";
import backgroundXL from "../assets/login/background_xl.jpg";
import { User, KeyRound, ArrowRight, Globe, XCircle } from "lucide-react";

const Login = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { loginUser, loading, error } = useAuthStore();
	const { apiBaseUrl, setApiBaseUrl } = useConfigStore();

	const formatUrl = (url) => {
		const trimmedUrl = url.trim();
		return trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`;
	};

	const onSubmit = async (values) => {
		const currentApiUrl = apiBaseUrl.trim();

		try {
			// Format and save the API URL first
			const formattedUrl = formatUrl(currentApiUrl);
			if (formattedUrl) {
				setApiBaseUrl(formattedUrl);
			}

			// Use the formatted URL for login
			const success = await loginUser(values, formattedUrl);
			if (success) {
				const redirectTo = new URLSearchParams(location.search).get(
					"redirectTo",
				);
				navigate({ to: redirectTo || "/simple/drinks" });
			}
		} catch (error) {
			console.error("Login error:", error);
		}
	};

	const getBackgroundImage = () => {
		if (window.innerWidth <= 571) return backgroundS;
		if (window.innerWidth <= 857) return backgroundM;
		if (window.innerWidth <= 1143) return backgroundL;
		return backgroundXL;
	};

	return (
		<div
			className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
			style={{ backgroundImage: `url(${getBackgroundImage()})` }}
		>
			<div className="card w-full max-w-md bg-base-100 shadow-lg">
				<div className="card-body">
					<div className="text-center mb-4">
						<img
							src={logoFull}
							alt="Logo"
							className="mx-auto mb-3 w-20 sm:w-24"
						/>
						<h2 className="text-xl font-bold mb-1">{t("login.headline")}</h2>
						<p className="text-sm">
							{t("login.subtitle") || "Please sign in to your account"}
						</p>
					</div>

					<div className="form-control w-full mb-3">
						<div className="input-group input-group-divider">
							<span className="flex items-center gap-2 px-2 min-w-[120px] justify-start rounded-l-lg text-sm whitespace-normal break-words">
								<Globe className="w-4 h-4 shrink-0" />
								<span>{t("login.api_url")}</span>
							</span>
							<input
								type="url"
								name="apiBaseUrl"
								value={apiBaseUrl}
								onChange={(e) => setApiBaseUrl(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Backspace" || e.key === "Delete") {
										e.stopPropagation();
									}
								}}
								placeholder="https://api.example.com"
								className="input w-full bg-base-100 focus:outline-none rounded-r-lg py-3 break-all"
								autoComplete="url"
								inputMode="url"
							/>
						</div>
					</div>

					{error && (
						<div className="alert alert-error mb-4 py-2 text-sm whitespace-normal break-words">
							<XCircle className="w-5 h-5 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<form
						name="login"
						onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.target);
							onSubmit({
								username: formData.get("username"),
								password: formData.get("password"),
								remember: formData.get("remember") === "on",
							});
						}}
						className="space-y-3"
					>
						<div className="form-control w-full">
							<div className="input-group input-group-divider">
								<span className="flex items-center gap-2 px-2 min-w-[120px] justify-start rounded-l-lg text-sm whitespace-normal break-words">
									<User className="w-4 h-4 shrink-0" />
									<span>{t("login.username")}</span>
								</span>
								<input
									type="text"
									name="username"
									placeholder={t("login.username_field_label")}
									className="input w-full bg-base-100 focus:outline-none rounded-r-lg py-3"
									required
									autoComplete="username"
									autoCapitalize="none"
									inputMode="email"
								/>
							</div>
						</div>

						<div className="form-control w-full">
							<div className="input-group input-group-divider">
								<span className="flex items-center gap-2 px-2 min-w-[120px] justify-start rounded-l-lg text-sm whitespace-normal break-words">
									<KeyRound className="w-4 h-4 shrink-0" />
									<span>{t("login.password")}</span>
								</span>
								<input
									type="password"
									name="password"
									placeholder={t("login.password_field_label")}
									className="input w-full bg-base-100 focus:outline-none rounded-r-lg py-3"
									required
									autoComplete="current-password"
								/>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
							<label className="label cursor-pointer">
								<input
									type="checkbox"
									name="remember"
									className="checkbox checkbox-primary checkbox-sm"
								/>
								<span className="label-text ml-2 text-sm">
									{t("login.remember_me") || "Remember me"}
								</span>
							</label>

							<a href="/forgot-password" className="link text-sm">
								{t("login.forgot_password") || "Forgot your password?"}
							</a>
						</div>

						<button
							type="submit"
							className="btn btn-primary w-full py-2 min-h-[2.5rem] text-sm mt-2"
							disabled={loading}
						>
							{loading && <span className="loading loading-spinner"></span>}
							{!loading && <ArrowRight className="w-5 h-5 mr-2" />}
							{loading
								? t("login.logging_in") || "Signing you in..."
								: t("login.btn_label") || "Sign in to your account"}
						</button>

						<div className="text-center mt-4 text-sm">
							<p>
								{t("login.no_account") || "Don't have an account?"}{" "}
								<a href="/register" className="link">
									{t("login.create_account") || "Create one here"}
								</a>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;

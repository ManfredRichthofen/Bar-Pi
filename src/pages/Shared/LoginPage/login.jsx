import React, { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import useAuthStore from "../../../store/authStore";
import useConfigStore from "../../../store/configStore";
import logoFull from "../../../assets/logo-full.svg";
import backgroundS from "../../../assets/login/background_s.jpg";
import backgroundM from "../../../assets/login/background_m.jpg";
import backgroundL from "../../../assets/login/background_l.jpg";
import backgroundXL from "../../../assets/login/background_xl.jpg";
import { User, KeyRound, ArrowRight, Globe, XCircle, ChevronDown, ChevronUp, Settings } from "lucide-react";

const Login = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { loginUser, loading, error } = useAuthStore();
	const { apiBaseUrl, setApiBaseUrl } = useConfigStore();
	const [showAdvanced, setShowAdvanced] = useState(false);

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
			<div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
				<div className="card-body p-6 sm:p-8">
					<div className="text-center mb-6">
						<img
							src={logoFull}
							alt="Logo"
							className="mx-auto mb-4 w-20 sm:w-24 drop-shadow-sm"
						/>
						<h2 className="text-2xl font-bold mb-2 break-words text-base-content">
							{t("login.headline")}
						</h2>
						<p className="text-sm text-base-content/70 break-words">
							{t("login.subtitle") || "Please sign in to your account"}
						</p>
					</div>

					{error && (
						<div className="alert alert-error mb-6 shadow-lg">
							<XCircle className="w-5 h-5 shrink-0" />
							<span className="break-words font-medium">{error}</span>
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
						className="space-y-4"
					>
						<fieldset className="fieldset border-base-300">
							<legend className="fieldset-legend flex items-center gap-2 text-base-content font-medium">
								<User className="w-4 h-4 shrink-0" />
								<span className="break-words">{t("login.username")}</span>
							</legend>
							<input
								type="text"
								name="username"
								placeholder={t("login.username_field_label")}
								className="input w-full bg-base-100 focus:outline-none py-3 border-base-300 focus:border-primary"
								required
								autoComplete="username"
								autoCapitalize="none"
								inputMode="email"
							/>
						</fieldset>

						<fieldset className="fieldset border-base-300">
							<legend className="fieldset-legend flex items-center gap-2 text-base-content font-medium">
								<KeyRound className="w-4 h-4 shrink-0" />
								<span className="break-words">{t("login.password")}</span>
							</legend>
							<input
								type="password"
								name="password"
								placeholder={t("login.password_field_label")}
								className="input w-full bg-base-100 focus:outline-none py-3 border-base-300 focus:border-primary"
								required
								autoComplete="current-password"
							/>
						</fieldset>

						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
							<label className="label cursor-pointer hover:bg-base-200 rounded-lg p-2 transition-colors">
								<input
									type="checkbox"
									name="remember"
									className="checkbox checkbox-primary checkbox-sm"
								/>
								<span className="label-text ml-2 text-sm break-words font-medium">
									{t("login.remember_me") || "Remember me"}
								</span>
							</label>

							<a href="/forgot-password" className="link link-primary text-sm break-words hover:underline">
								{t("login.forgot_password") || "Forgot your password?"}
							</a>
						</div>

						{/* Advanced Settings Expander */}
						<div className="collapse collapse-arrow bg-base-200/50 border border-base-300 w-full">
							<input 
								type="checkbox" 
								checked={showAdvanced}
								onChange={(e) => setShowAdvanced(e.target.checked)}
							/>
							<div className="collapse-title text-sm font-medium flex items-center gap-2 min-h-0 hover:bg-base-200/70 transition-colors">
								<Settings className="w-4 h-4 shrink-0" />
								<span className="break-words">{t("login.advanced_settings") || "Advanced Settings"}</span>
							</div>
							<div className="collapse-content">
								<fieldset className="fieldset mt-3 border-base-300">
									<legend className="fieldset-legend flex items-center gap-2 text-base-content font-medium">
										<Globe className="w-4 h-4 shrink-0" />
										<span className="break-words">{t("login.api_url")}</span>
									</legend>
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
										className="input w-full bg-base-100 focus:outline-none p-3 break-all border-base-300 focus:border-primary"
										autoComplete="url"
										inputMode="url"
									/>
									<p className="label text-base-content/60 break-words whitespace-normal mt-2">
										{t("login.api_url_help") || "Leave empty to use default API endpoint"}
									</p>
								</fieldset>
							</div>
						</div>

						<button
							type="submit"
							className="btn btn-primary w-full py-3 min-h-[3rem] text-sm mt-4 shadow-lg hover:shadow-xl transition-all duration-200"
							disabled={loading}
						>
							{loading && <span className="loading loading-spinner loading-sm"></span>}
							{!loading && <ArrowRight className="w-5 h-5 mr-2 shrink-0" />}
							<span className="break-words font-medium">
								{loading
									? t("login.logging_in") || "Signing you in..."
									: t("login.btn_label") || "Sign in to your account"}
							</span>
						</button>

						<div className="text-center mt-6 pt-4 border-t border-base-300">
							<p className="break-words text-base-content/70">
								{t("login.no_account") || "Don't have an account?"}{" "}
								<a href="/register" className="link link-primary break-words hover:underline font-medium">
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

import { KeyRound, Mail, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { requestLogin, resendOtp, verifyOtp } from "../services/api";

const logoUrl = "https://aagarg.in/wp-content/uploads/2025/05/A2G-New-Logo-Black.avif";

function LoginModal({ embedded = false, onClose, onAuthenticated }) {
  const [step, setStep] = useState("credentials");
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [challengeId, setChallengeId] = useState("");
  const [displayOtp, setDisplayOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!otpExpiresAt) {
      return undefined;
    }

    function updateCountdown() {
      const remaining = Math.max(Math.ceil((new Date(otpExpiresAt).getTime() - Date.now()) / 1000), 0);
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        setDisplayOtp("");
      }
    }

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [otpExpiresAt]);

  function updateOtp(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = form.otp.padEnd(6, " ").split("");
    nextOtp[index] = digit || " ";
    const otp = nextOtp.join("").replace(/\s/g, "");
    setForm({ ...form, otp });

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !form.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await requestLogin({ email: form.email, password: form.password });
      setChallengeId(data.challengeId);
      setDisplayOtp(data.displayOtp || "");
      setOtpExpiresAt(data.otpExpiresAt || "");
      setForm((current) => ({ ...current, otp: "" }));
      setStep("otp");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setResending(true);

    try {
      const data = await resendOtp({ challengeId });
      setChallengeId(data.challengeId);
      setDisplayOtp(data.displayOtp || "");
      setOtpExpiresAt(data.otpExpiresAt || "");
      setForm((current) => ({ ...current, otp: "" }));
      otpRefs.current[0]?.focus();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not resend OTP");
    } finally {
      setResending(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp({ challengeId, otp: form.otp });
      localStorage.setItem("a2g_token", data.token);
      onAuthenticated(data.user);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  const content = (
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-emerald-900/20">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[560px] overflow-hidden bg-[#064b36] p-8 text-white lg:block">
            <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-lime-300/30 blur-3xl" />
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-44 w-44 rounded-full bg-lime-200/25 blur-3xl" />
            <div className="absolute inset-x-10 top-24 h-64 rounded-full bg-white/5 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="inline-flex w-fit rounded-2xl bg-white p-3 shadow-xl shadow-emerald-900/15">
                <img src={logoUrl} alt="A2G logo" className="h-12 w-auto object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/85">A2G People Suite</p>
                <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
                  Secure access to your HR command center.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
                  Manage employee data, onboarding, and workforce health with a focused admin workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-6 sm:p-10 lg:p-14">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-[#eff6df]" />
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#064b36]">Secure Access</p>
                <h2 className="mt-2 text-4xl font-black text-[#15372b]">{step === "credentials" ? "Welcome back" : "Verify OTP"}</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {step === "credentials" ? "Login with your email and password to continue." : "Enter the OTP sent to your registered email. The code is valid for 5 minutes."}
                </p>
              </div>
              {!embedded ? (
                <button
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                  type="button"
                  aria-label="Close login"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>

            {error ? <div className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div> : null}
            {step === "otp" && displayOtp ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">
                <span className="font-semibold">Your login OTP: </span>
                <span className="text-lg font-black tracking-[0.25em]">{displayOtp}</span>
                <span className="ml-2 text-xs text-emerald-700">({Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")})</span>
              </div>
            ) : null}

            {step === "credentials" ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 focus-within:border-[#064b36] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/10">
                <Mail size={18} className="text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent py-1 text-sm outline-none"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="admin@a2g.com"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 focus-within:border-[#064b36] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/10">
                <KeyRound size={18} className="text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent py-1 text-sm outline-none"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Password"
                  required
                />
              </div>
            </label>
            <button className="w-full rounded-2xl bg-[#064b36] px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-[#0b5d43]" type="submit">
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <span className="mb-3 block text-sm font-semibold text-slate-700">OTP</span>
              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    className="aspect-square w-full rounded-2xl border border-slate-200 bg-[#f6f8f4] text-center text-2xl font-black text-[#15372b] outline-none transition focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                    inputMode="numeric"
                    maxLength={1}
                    value={form.otp[index] || ""}
                    onChange={(event) => updateOtp(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    required
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ShieldCheck size={14} />
                Enter the 6 digit verification code
              </div>
            </div>
            <button className="w-full rounded-xl bg-[#064b36] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-[#0b5d43]" type="submit">
              {loading ? "Verifying..." : "Verify and Login"}
            </button>
            <button
              onClick={handleResendOtp}
              disabled={resending || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#064b36] transition hover:bg-[#eff6df] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              <RefreshCw size={17} className={resending ? "animate-spin" : ""} />
              {resending ? "Resending OTP..." : "Resend OTP"}
            </button>
          </form>
        )}
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-2 py-6">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eff6df]0/20 px-4 py-6">
      {content}
    </div>
  );
}

export default LoginModal;

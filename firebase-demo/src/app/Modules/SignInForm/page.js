"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import "./SignInForm.css";

export default function SignInForm() {
  const router = useRouter();
  const auth = getAuth();

  const formRef = useRef(null);
  const passwordRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [signinDisabled, setSigninDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [multiFactorResolver, setMultiFactorResolver] = useState(null);
  const [selectedHint, setSelectedHint] = useState(null);
  const [mfaPhoneNumber, setMfaPhoneNumber] = useState("");
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [mfaVerificationId, setMfaVerificationId] = useState("");

  const [isSendingMfaCode, setIsSendingMfaCode] = useState(false);
  const [isVerifyingMfaCode, setIsVerifyingMfaCode] = useState(false);

  useEffect(() => {
    const input = passwordRef.current;

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  async function getRecaptchaVerifier() {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container-signin",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved for sign-in.");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired for sign-in.");
          },
        }
      );

      const widgetId = await recaptchaVerifierRef.current.render();
      console.log("reCAPTCHA widget rendered with ID:", widgetId);
    }

    return recaptchaVerifierRef.current;
  }

  function handleTogglePassword() {
    setShowPassword((value) => !value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSigninDisabled(true);
    setErrorMessage("");

    const form = formRef.current;

    if (!form) {
      setSigninDisabled(false);
      return;
    }

    form.reportValidity();

    if (!form.checkValidity()) {
      setSigninDisabled(false);
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("current-password") || "");

    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert("Welcome back!");
      router.push("/");
    } catch (error) {
      console.error("Firebase sign in error:", error);

      if (error.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);

        const phoneHint = resolver.hints.find(
          (hint) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID
        );

        if (!phoneHint) {
          setErrorMessage(
            "Multi-Factor Authentication is required, but no phone factor was found."
          );
          setSigninDisabled(false);
          return;
        }

        setMultiFactorResolver(resolver);
        setSelectedHint(phoneHint);
        setMfaPhoneNumber(phoneHint.phoneNumber || "your enrolled phone");
        setShowMfaChallenge(true);
        setErrorMessage(
          "Multi-Factor Authentication required. Click Send Code to continue."
        );
      } else {
        setErrorMessage(error.message || "Unable to sign in.");
      }

      setSigninDisabled(false);
    }
  }

  async function sendMfaChallengeCode() {
    if (!multiFactorResolver || !selectedHint) {
      setErrorMessage("Missing MFA resolver or selected phone factor.");
      return;
    }

    setIsSendingMfaCode(true);
    setErrorMessage("");

    try {
      const appVerifier = await getRecaptchaVerifier();

      const phoneInfoOptions = {
        multiFactorHint: selectedHint,
        session: multiFactorResolver.session,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        appVerifier
      );

      setMfaVerificationId(verificationId);
      setErrorMessage("Verification code sent. Please check your phone.");
    } catch (error) {
      console.error("Error sending MFA challenge code:", error);
      setErrorMessage(error.message || "Failed to send MFA verification code.");

      // Do not call recaptchaVerifierRef.current.clear() here.
    } finally {
      setIsSendingMfaCode(false);
    }
  }

  async function completeMfaSignIn() {
    if (!mfaVerificationCode || !mfaVerificationId || !multiFactorResolver) {
      setErrorMessage("Missing MFA verification code or verification ID.");
      return;
    }

    setIsVerifyingMfaCode(true);
    setErrorMessage("");

    try {
      const phoneAuthCredential = PhoneAuthProvider.credential(
        mfaVerificationId,
        mfaVerificationCode
      );

      const multiFactorAssertion =
        PhoneMultiFactorGenerator.assertion(phoneAuthCredential);

      await multiFactorResolver.resolveSignIn(multiFactorAssertion);

      alert("Signed in successfully with MFA!");
      router.push("/");
    } catch (error) {
      console.error("Error completing MFA sign-in:", error);

      if (error.code === "auth/invalid-verification-code") {
        setErrorMessage(
          "Invalid verification code. Please check the code or send a new one."
        );
      } else if (error.code === "auth/code-expired") {
        setErrorMessage("The verification code expired. Please send a new one.");
      } else {
        setErrorMessage(error.message || "Failed to verify MFA code.");
      }
    } finally {
      setIsVerifyingMfaCode(false);
    }
  }

  return (
    <form ref={formRef} method="post" id="form" name="form" onSubmit={handleSubmit}>
      <button type="button" className="back-button" onClick={() => router.back()}>
        Back
      </button>

      <h1>Sign in</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {!showMfaChallenge ? (
        <>
          <section>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </section>

          <section>
            <label htmlFor="current-password">Password</label>
            <input
              id="current-password"
              name="current-password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
            />

            <button
              id="toggle-password"
              type="button"
              onClick={handleTogglePassword}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </section>

          <button id="signin" type="submit" disabled={signinDisabled}>
            {signinDisabled ? "Signing in..." : "Sign in"}
          </button>
        </>
      ) : (
        <section>
          <h2>Multi-Factor Authentication</h2>

          <p>Send a verification code to {mfaPhoneNumber}.</p>

          <button
            type="button"
            onClick={sendMfaChallengeCode}
            disabled={isSendingMfaCode}
          >
            {isSendingMfaCode ? "Sending Code..." : "Send Code"}
          </button>

          {!!mfaVerificationId && (
            <>
              <label htmlFor="mfa-verification-code">Verification Code</label>
              <input
                id="mfa-verification-code"
                type="text"
                value={mfaVerificationCode}
                onChange={(event) =>
                  setMfaVerificationCode(event.target.value.trim())
                }
                placeholder="123456"
                required
                disabled={isVerifyingMfaCode}
              />

              <button
                type="button"
                onClick={completeMfaSignIn}
                disabled={isVerifyingMfaCode}
              >
                {isVerifyingMfaCode ? "Verifying..." : "Verify Code"}
              </button>
            </>
          )}
        </section>
      )}

      <div id="recaptcha-container-signin"></div>
    </form>
  );
}
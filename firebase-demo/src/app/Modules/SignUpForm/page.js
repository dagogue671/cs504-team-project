"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from "firebase/auth";
import "./SignUpForm.css";
import { auth } from "../../firebase";

export default function SignUpForm() {
  const router = useRouter();

  const formRef = useRef(null);
  const passwordRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [showMfaEnrollment, setShowMfaEnrollment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);

  useEffect(() => {
    const input = passwordRef.current;

    const clearValidity = () => {
      if (input) input.setCustomValidity("");
    };

    if (input) {
      input.addEventListener("input", clearValidity);
    }

    return () => {
      if (input) {
        input.removeEventListener("input", clearValidity);
      }

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
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved.");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired.");
          },
        }
      );

      const widgetId = await recaptchaVerifierRef.current.render();
      console.log("reCAPTCHA widget rendered with ID:", widgetId);
    }

    return recaptchaVerifierRef.current;
  }

  function validatePassword() {
    const input = passwordRef.current;
    if (!input) return;

    let message = "";

    if (!/.{8,}/.test(input.value)) {
      message = "Password must have at least eight characters.";
    } else if (!/.*[A-Z].*/.test(input.value)) {
      message = "Password must have at least one uppercase letter.";
    } else if (!/.*[a-z].*/.test(input.value)) {
      message = "Password must have at least one lowercase letter.";
    }

    input.setCustomValidity(message);
  }

  function handleTogglePassword() {
    setShowPassword((value) => !value);
  }

  async function handleFormSubmission(event) {
    event.preventDefault();

    validatePassword();

    const form = formRef.current;
    if (!form) return;

    form.reportValidity();

    if (!form.checkValidity()) {
      return;
    }

    setSignupDisabled(true);
    setErrorMessage("");
    setInfoMessage("");

    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await sendEmailVerification(userCredential.user);

      setInfoMessage(
        "Account created. A verification email has been sent. Please verify your email before setting up MFA."
      );

      alert(
        "Account created. Please check your email and verify your account before setting up MFA."
      );

      setSignupDisabled(false);
    } catch (error) {
      console.error("Firebase sign up error:", error);
      setErrorMessage(error.message || "Unable to create account.");
      setSignupDisabled(false);
    }
  }

  async function checkEmailVerification() {
    setErrorMessage("");
    setInfoMessage("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No user is currently signed in.");
      }

      await currentUser.reload();

      if (!currentUser.emailVerified) {
        setErrorMessage(
          "Your email is not verified yet. Please check your inbox or spam folder."
        );
        return;
      }

      setInfoMessage("Email verified. You can now enroll in MFA.");
      setShowMfaEnrollment(true);
    } catch (error) {
      console.error("Email verification check error:", error);
      setErrorMessage(error.message || "Unable to check email verification.");
    }
  }

  async function resendVerificationEmail() {
    setErrorMessage("");
    setInfoMessage("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No user is currently signed in.");
      }

      await sendEmailVerification(currentUser);

      setInfoMessage("Verification email resent. Please check your inbox.");
    } catch (error) {
      console.error("Resend verification email error:", error);
      setErrorMessage(error.message || "Unable to resend verification email.");
    }
  }

  async function sendMfaVerificationCode() {
    if (!phoneNumber) {
      setErrorMessage("Please enter a phone number.");
      return;
    }

    setIsSendingCode(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No user is currently signed in for MFA enrollment.");
      }

      await currentUser.reload();

      if (!currentUser.emailVerified) {
        throw new Error("Please verify your email before enrolling MFA.");
      }

      const appVerifier = await getRecaptchaVerifier();

      const multiFactorSession = await multiFactor(currentUser).getSession();

      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);

      const id = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        appVerifier
      );

      setVerificationId(id);
      setInfoMessage("Verification code sent to your phone.");
    } catch (error) {
      console.error("Error sending MFA verification code:", error);
      setErrorMessage(error.message || "Failed to send verification code.");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function completeMfaEnrollment() {
    if (!verificationCode) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    setIsEnrollingMfa(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No user is currently signed in for MFA enrollment.");
      }

      if (!verificationId) {
        throw new Error("Missing verification ID. Please resend the code.");
      }

      const phoneAuthCredential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );

      const multiFactorAssertion =
        PhoneMultiFactorGenerator.assertion(phoneAuthCredential);

      await multiFactor(currentUser).enroll(
        multiFactorAssertion,
        "Phone Number"
      );

      alert("Multi-Factor Authentication enrolled successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error completing MFA enrollment:", error);
      setErrorMessage(error.message || "Failed to complete MFA enrollment.");
    } finally {
      setIsEnrollingMfa(false);
    }
  }

  return (
    <main>
      <button type="button" className="back-button" onClick={() => router.back()}>
        Back
      </button>

      <form ref={formRef} method="post" onSubmit={handleFormSubmission}>
        <h1>Sign up</h1>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {infoMessage && <p className="info-message">{infoMessage}</p>}

        {!showMfaEnrollment ? (
          <>
            <section>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                pattern="[\p{L}\.\- ]+"
              />
            </section>

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
              <label htmlFor="password">Password</label>

              <button
                id="toggle-password"
                type="button"
                aria-label={
                  showPassword ? "Hide password." : "Show password as plain text."
                }
                onClick={handleTogglePassword}
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>

              <input
                id="password"
                name="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                aria-describedby="password-constraints"
                required
              />

              <div id="password-constraints">
                Eight or more characters, including uppercase and lowercase
                letters.
              </div>
            </section>

            <button id="sign-up" type="submit" disabled={signupDisabled}>
              {signupDisabled ? "Signing up..." : "Sign up"}
            </button>

            <button type="button" onClick={checkEmailVerification}>
              I verified my email
            </button>

            <button type="button" onClick={resendVerificationEmail}>
              Resend verification email
            </button>
          </>
        ) : (
          <section>
            <h2>Enroll in Multi-Factor Authentication</h2>
            <p>Please provide your phone number to set up MFA.</p>

            <label htmlFor="phone-number">Phone Number</label>
            <input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+16711234567"
              required
              disabled={!!verificationId || isSendingCode}
            />

            <button
              type="button"
              onClick={sendMfaVerificationCode}
              disabled={isSendingCode || !!verificationId}
            >
              {isSendingCode ? "Sending Code..." : "Send Verification Code"}
            </button>

            {!!verificationId && (
              <>
                <label htmlFor="verification-code">Verification Code</label>
                <input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="123456"
                  required
                  disabled={isEnrollingMfa}
                />

                <button
                  type="button"
                  onClick={completeMfaEnrollment}
                  disabled={isEnrollingMfa}
                >
                  {isEnrollingMfa ? "Enrolling..." : "Complete MFA Enrollment"}
                </button>
              </>
            )}
          </section>
        )}
      </form>

      <div id="recaptcha-container"></div>
    </main>
  );
}
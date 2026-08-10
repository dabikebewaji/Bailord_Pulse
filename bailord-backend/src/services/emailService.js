import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Thin Resend wrapper. If RESEND_API_KEY isn't set, log the code instead of
// sending — keeps local dev unblocked without a Resend account.
//
// A delivery failure here (e.g. a sandbox Resend account with no verified
// domain, which rejects any recipient other than its own test addresses)
// falls back to the same console log rather than throwing. The caller
// (registerUser/resendOtp) already created the DB rows for this OTP by the
// time this runs — letting a provider-side rejection bubble up turned that
// into a hard 500 that looked like registration itself had failed, when the
// account had actually been created. Actual delivery failures are still
// visible in the server log for debugging.
export const sendOtpEmail = async (to, code) => {
  if (!resend) {
    console.log(`[dev] OTP for ${to}: ${code}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Bailord Pulse <onboarding@resend.dev>",
      to,
      subject: "Your Bailord Pulse verification code",
      html: `
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
    if (error) throw error;
  } catch (error) {
    console.error(`⚠️  Resend delivery failed for ${to}, falling back to console log:`, error?.message || error);
    console.log(`[dev fallback] OTP for ${to}: ${code}`);
  }
};

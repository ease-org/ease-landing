/**
 * Gated download of the closed-trial Android APK.
 *
 * The APK is deliberately not part of the site. A file under `public/` is a
 * static asset: Vercel serves it to anyone who knows the path, and the key
 * gate on /trial/ is client-side JavaScript that only reveals a link. The
 * binary therefore lives in the private `trial-builds` bucket of the
 * ease-trial Supabase project, and this function is the only way to it.
 *
 * It checks the key server-side with the same `validate_trial_key` RPC the
 * page uses, then hands back a signed URL that expires in a minute. Without a
 * live key there is no URL to follow.
 *
 * Reached as /trial/download?k=EASE-XXXX-XXXX (see the rewrite in vercel.json).
 */

const PROJECT = process.env.TRIAL_SUPABASE_URL || "https://yolwyazckiqdjhepjiex.supabase.co";
const BUCKET = "trial-builds";
const OBJECT = "ease-android.apk";

/** Long enough for a phone on a slow connection to start the download, short enough to be useless if shared. */
const TTL_SECONDS = 60;

/** The shortest key we will spend a backend round trip on; real keys are EASE-XXXX-XXXX. */
const MIN_KEY_LENGTH = 8;

function fail(res, status, error) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ error });
}

export default async function handler(req, res) {
  // The service key of the ease-trial project. Set on the Vercel project, never in the repo.
  const secret = process.env.TRIAL_SUPABASE_SECRET;
  if (!secret) {
    return fail(res, 503, "The download is not configured on this deployment.");
  }

  const fromQuery = req.query?.k;
  const k = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery;
  const key = String(k ?? "").trim().toUpperCase();
  if (key.length < MIN_KEY_LENGTH) {
    return fail(res, 400, "A trial key is required.");
  }

  const headers = {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };

  let valid = false;
  try {
    const answer = await fetch(`${PROJECT}/rest/v1/rpc/validate_trial_key`, {
      method: "POST",
      headers,
      body: JSON.stringify({ k: key }),
    });
    if (!answer.ok) throw new Error(`validate_trial_key: http ${answer.status}`);
    valid = (await answer.json()) === true;
  } catch {
    return fail(res, 502, "The trial backend did not answer. Try again in a moment.");
  }
  if (!valid) {
    return fail(res, 403, "Key not recognized.");
  }

  let signed;
  try {
    const answer = await fetch(`${PROJECT}/storage/v1/object/sign/${BUCKET}/${OBJECT}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ expiresIn: TTL_SECONDS }),
    });
    if (!answer.ok) throw new Error(`sign: http ${answer.status}`);
    signed = (await answer.json())?.signedURL;
  } catch {
    return fail(res, 502, "The build store did not answer. Try again in a moment.");
  }
  if (!signed) {
    return fail(res, 502, "The build store returned no link.");
  }

  // `download` makes Supabase send Content-Disposition: attachment, so the phone
  // saves an APK instead of trying to render it.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.redirect(302, `${PROJECT}/storage/v1${signed}&download=${OBJECT}`);
}

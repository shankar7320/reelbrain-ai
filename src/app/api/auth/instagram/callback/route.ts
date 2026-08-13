import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/connect?error=" + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/connect?error=no_code", request.url));
  }

  // In a real implementation, you would:
  // 1. Exchange the code for an access token
  // 2. Fetch user profile
  // 3. Store the token securely
  // 4. Create a session

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/instagram/callback";

  if (!clientId || !clientSecret) {
    // No credentials configured, redirect with demo data
    return NextResponse.redirect(new URL("/connect?code=" + code, request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(new URL("/connect?error=" + tokenData.error_message, request.url));
    }

    // Fetch user profile
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`
    );
    const userData = await userResponse.json();

    // Redirect back to connect page with user data
    const userParam = encodeURIComponent(JSON.stringify({
      id: userData.id,
      username: userData.username,
      accessToken: tokenData.access_token,
    }));

    return NextResponse.redirect(new URL("/connect?user=" + userParam, request.url));
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL("/connect?error=oauth_failed", request.url));
  }
}

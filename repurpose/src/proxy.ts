import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedPage = createRouteMatcher([
  "/workspace(.*)",
  "/history(.*)",
  "/voice(.*)",
  "/billing(.*)",
  "/onboarding(.*)",
]);

const isProtectedApi = createRouteMatcher(["/api/generate(.*)", "/api/voice(.*)"]);

const unauthorized = () =>
  Response.json({ error: "UNAUTHORIZED", message: "Please sign in to continue." }, { status: 401 });

// Webhooks (/api/webhooks/*) and marketing are intentionally public.
export default clerkMiddleware(async (auth, req) => {
  // RSC payload requests (router.refresh, client navigation) are fetches, not documents.
  // Redirecting them drops the user on an HTML sign-in page mid-flow, so answer with 401
  // and let the router fall back to a real navigation.
  const isRsc = req.headers.get("rsc") === "1";

  if (isProtectedApi(req) || (isProtectedPage(req) && isRsc)) {
    const { userId } = await auth();
    if (!userId) return unauthorized();
    return;
  }

  if (isProtectedPage(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // explicitly marking sign-in and sign-up as public prevents the infinite redirect loop
  publicRoutes: [
    "/", 
    "/feedback(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/(.*)"
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
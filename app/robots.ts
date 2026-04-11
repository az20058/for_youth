import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/programs"],
        disallow: [
          "/api/",
          "/applications",
          "/cover-letters",
          "/schedule",
          "/quiz",
          "/login",
          "/test-datepicker",
        ],
      },
    ],
    sitemap: "https://for-youth.site/sitemap.xml",
  };
}

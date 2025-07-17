/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://opensourcetoolkit.com",
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [],
      },
    ],
  },
};

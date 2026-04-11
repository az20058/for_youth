import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("sitemap", () => {
  it("공개 페이지를 포함한다", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://for-youth.site");
    expect(urls).toContain("https://for-youth.site/programs");
  });

  it("인증 필요 페이지를 제외한다", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).not.toContain("https://for-youth.site/applications");
    expect(urls).not.toContain("https://for-youth.site/cover-letters");
    expect(urls).not.toContain("https://for-youth.site/quiz");
    expect(urls).not.toContain("https://for-youth.site/login");
  });

  it("sitemap URL이 for-youth.site 도메인을 가진다", () => {
    const entries = sitemap();
    entries.forEach((e) => {
      expect(e.url).toMatch(/^https:\/\/for-youth\.site/);
    });
  });
});

describe("robots", () => {
  it("공개 페이지를 허용한다", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allow = rules[0].allow as string[];
    expect(allow).toContain("/");
    expect(allow).toContain("/programs");
  });

  it("인증 필요 페이지를 차단한다", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallow = rules[0].disallow as string[];
    expect(disallow).toContain("/applications");
    expect(disallow).toContain("/cover-letters");
    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/quiz");
    expect(disallow).toContain("/login");
  });

  it("sitemap URL을 포함한다", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://for-youth.site/sitemap.xml");
  });
});

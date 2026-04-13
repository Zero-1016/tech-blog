import { test, expect } from "@playwright/test";

test.describe("메인 페이지", () => {
  test("제목과 설명이 보인다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Tech Blog");
    await expect(page.getByText("© Copyright All Developers")).toBeVisible();
  });

  test("포스트 목록이 보인다", async ({ page }) => {
    await page.goto("/");
    const posts = page.locator("article");
    await expect(posts).toHaveCount(1);
  });

  test("포스트 클릭 시 상세 페이지로 이동", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Hello World").click();
    await expect(page).toHaveURL(/\/posts\/hello-world/);
  });
});

test.describe("포스트 상세", () => {
  test("제목, 날짜, 태그가 보인다", async ({ page }) => {
    await page.goto("/posts/hello-world");
    await expect(page.locator("h1")).toContainText("Hello World");
    await expect(page.getByText("2026년")).toBeVisible();
    await expect(page.getByText("블로그")).toBeVisible();
  });

  test("목차가 보인다 (xl 화면)", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/posts/hello-world");
    await expect(page.getByText("목차")).toBeVisible();
  });

  test("모바일 목차 토글", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/posts/hello-world");
    const tocButton = page.getByRole("button", { name: /목차/ });
    await tocButton.click();
    await expect(page.getByText("이 블로그는 뭔가요?")).toBeVisible();
  });
});

test.describe("검색", () => {
  test("Cmd+K로 검색 모달 열기", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("글 제목")).toBeVisible();
  });
});

test.describe("다크모드", () => {
  test("토글 동작", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByLabel("Toggle theme");
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("404", () => {
  test("없는 페이지에서 404 표시", async ({ page }) => {
    await page.goto("/posts/nonexistent");
    await expect(page.getByText("404")).toBeVisible();
  });
});

test.describe("태그 페이지", () => {
  test("태그 클릭 시 필터된 목록", async ({ page }) => {
    await page.goto("/tags/AI");
    await expect(page.locator("h1")).toHaveText("#AI");
  });
});

test.describe("SEO", () => {
  test("sitemap.xml 접근 가능", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("feed.xml 접근 가능", async ({ page }) => {
    const response = await page.goto("/feed.xml");
    expect(response?.status()).toBe(200);
  });
});

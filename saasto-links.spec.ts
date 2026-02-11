import { test, expect } from '@playwright/test';

// 環境変数 BASE_URL があればそれを使う。なければローカル想定。
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/';

/**
 * テストステップをラップして、成功/失敗時にログを出すヘルパー。
 */
async function runStep(stepName: string, fn: () => Promise<void>) {
  console.log(`STEP START: ${stepName}`);
  try {
    await fn();
    console.log(`STEP OK   : ${stepName}`);
  } catch (error) {
    console.error(`STEP FAIL : ${stepName}`);
    console.error(error);
    // ここで握りつぶすとテストがグリーンになるので、必ず再スローする
    throw error;
  }
}

test.describe('SaaSto LP - header & CTA links', () => {
  test.beforeEach(async ({ page }) => {
    await runStep('トップページへ遷移して hero 見出しを確認', async () => {
      await page.goto(BASE_URL);
      await expect(
        page.getByRole('heading', {
          name: /Committed To People/i, // Home_01 の見出し想定
        }),
      ).toBeVisible();
    });
  });

  const headerLinks: {
    label: string;
    expectedUrl: RegExp;
  }[] = [
    { label: 'Home', expectedUrl: /\/(#top)?$/i },
    { label: 'About us', expectedUrl: /#about/i },
    { label: 'Services', expectedUrl: /#services/i },
    { label: 'Blog', expectedUrl: /\/blog(\/)?(#.*)?$/i },
    { label: 'Contact us', expectedUrl: /#contact/i },
  ];

  for (const { label, expectedUrl } of headerLinks) {
    test(`header link "${label}" navigates to expected location`, async ({
      page,
    }) => {
      await runStep(`"${label}" リンクを表示`, async () => {
        await expect(page.getByRole('link', { name: label })).toBeVisible();
      });

      await runStep(`"${label}" をクリック`, async () => {
        await page.getByRole('link', { name: label }).click();
      });

      await runStep(`"${label}" クリック後の URL を確認`, async () => {
        await expect(page).toHaveURL(expectedUrl);
      });
    });
  }

  test('Login link navigates to login page', async ({ page }) => {
    await runStep('"Login" リンクをクリック', async () => {
      const loginLink = page.getByRole('link', { name: 'Login' });
      await expect(loginLink).toBeVisible();
      await loginLink.click();
    });

    await runStep('Login ページの URL/見出しを確認', async () => {
      await expect(page).toHaveURL(/\/login(\/)?$/i);
      await expect(
        page.getByRole('heading', { name: /Login/i }),
      ).toBeVisible();
    });
  });

  test('Sign up link navigates to signup page', async ({ page }) => {
    await runStep('"Sign up" リンクをクリック', async () => {
      const signUpLink = page.getByRole('link', { name: 'Sign up' });
      await expect(signUpLink).toBeVisible();
      await signUpLink.click();
    });

    await runStep('Sign up ページの URL/見出しを確認', async () => {
      await expect(page).toHaveURL(/\/signup(\/)?$/i);
      await expect(
        page.getByRole('heading', { name: /Sign up/i }),
      ).toBeVisible();
    });
  });

  test('hero CTA "Get Started Now" navigates to signup or trial page', async ({
    page,
  }) => {
    // button / link のどちらでも拾えるようにしておく（実装に合わせて片方にしてOK）
    const ctaButton = page.getByRole('button', {
      name: 'Get Started Now',
    });
    const ctaLink = page.getByRole('link', { name: 'Get Started Now' });

    await runStep('CTA "Get Started Now" を表示', async () => {
      // どちらかが Visible なら OK という扱い
      const buttonVisible = await ctaButton.isVisible().catch(() => false);
      const linkVisible = await ctaLink.isVisible().catch(() => false);

      if (!buttonVisible && !linkVisible) {
        throw new Error(
          'CTA "Get Started Now" が button/link いずれのロールでも見つかりませんでした。',
        );
      }
    });

    await runStep('CTA "Get Started Now" をクリック', async () => {
      if (await ctaButton.isVisible().catch(() => false)) {
        await ctaButton.click();
      } else {
        await ctaLink.click();
      }
    });

    await runStep('CTA クリック後の URL を確認', async () => {
      // /signup or /trial に飛ぶ想定。実装に合わせて修正する。
      await expect(page).toHaveURL(/\/(signup|trial)(\/)?/i);
    });
  });
});

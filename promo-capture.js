const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'docs');
const FFMPEG = 'C:\\Users\\Shiping\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe';

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\Shiping\\AppData\\Local\\ms-playwright\\chromium-1179\\chrome-win\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const pages = [
    { url: 'http://localhost:5173/',          name: 'home',     wait: 3000 },
    { url: 'http://localhost:5173/student',   name: 'student',  wait: 3000 },
    { url: 'http://localhost:5173/reviewer',  name: 'reviewer', wait: 3000 },
    { url: 'http://localhost:5173/admin',     name: 'admin',    wait: 3000 },
  ];

  const framePaths = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(p.wait);

    const outPath = path.join(OUTPUT_DIR, `frame-${i + 1}-${p.name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    framePaths.push(outPath);
    console.log(`✓ [${i + 1}/${pages.length}] ${p.name}: ${p.url}`);
  }

  const heroPath = path.join(OUTPUT_DIR, 'acadshield-hero.png');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: heroPath, clip: { x: 0, y: 0, width: 1280, height: 520 } });
  console.log(`\n✓ Hero image: ${heroPath}`);

  await browser.close();

  console.log('\n🎬 Generating GIF...');
  try {
    const gifPath = path.join(OUTPUT_DIR, 'acadshield-promo.gif');
    const inputPattern = path.join(OUTPUT_DIR, 'frame-%d-home.png');
    
    const concatList = path.join(OUTPUT_DIR, 'frames.txt');
    const listContent = framePaths.map(f => {
      const rel = path.basename(f);
      return `file '${rel}'\nduration 2.5`;
    }).join('\n') + `\nfile '${path.basename(framePaths[framePaths.length - 1])}'`;
    fs.writeFileSync(concatList, listContent);

    execSync(
      `"${FFMPEG}" -y -f concat -safe 0 -i "${concatList}" ` +
      `-vf "fps=10,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" ` +
      `-loop 0 "${gifPath}"`,
      { stdio: 'pipe', cwd: OUTPUT_DIR }
    );

    const size = (fs.statSync(gifPath).size / 1024 / 1024).toFixed(2);
    console.log(`✅ GIF created: ${gifPath} (${size} MB)`);
  } catch (e) {
    console.error('❌ FFmpeg GIF creation failed:', e.message);
    
    console.log('\n📦 Creating fallback: static promo image...');
    const promoPath = path.join(OUTPUT_DIR, 'acadshield-promo.png');
    try {
      execSync(
        `"${FFMPEG}" -y -i "${framePaths[0]}" -i "${framePaths[1]}" -i "${framePaths[2]}" -i "${framePaths[3]}" ` +
        `-filter_complex "[0][1][2][3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" "${promoPath}"`,
        { stdio: 'pipe' }
      );
      console.log(`✅ Static promo image: ${promoPath}`);
    } catch (e2) {
      console.error('❌ Static image also failed:', e2.message);
    }
  }

  fs.rmSync(path.join(OUTPUT_DIR, 'frames.txt'), { force: true });
  console.log('\n✅ Done! Files in docs/ directory');
})();

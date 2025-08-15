export function hslPalette(n: number): string[] {
    // 범용 HSL 팔레트(라벨 개수에 맞춰 균등 분배)
    const arr: string[] = [];
    for (let i = 0; i < n; i++) {
      const hue = Math.round((360 * i) / Math.max(1, n));
      arr.push(`hsl(${hue} 70% 55%)`);
    }
    return arr;
  }
  
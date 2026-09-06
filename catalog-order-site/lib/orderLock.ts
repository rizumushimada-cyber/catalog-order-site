import { Mutex } from 'async-mutex';

/**
 * 排他制御（同時発注対策）
 * ------------------------------------------------------------------
 * 方式A（インスタンス内直列化）+ 方式B（楽観的ロック／再読込チェック）を併用する。
 *
 * - 方式A: 同一サーバーレスインスタンス内で、商品IDごとにMutexを使い、
 *   在庫チェック→減算の区間を直列化する（このファイル）。
 * - 方式B: 実際の在庫チェック・減算処理（/app/api/orders/route.ts）では、
 *   Googleシートへの書き込み直前に最新在庫を再取得し、その場でチェックしてから
 *   書き込む。複数インスタンスが同時に動いた場合の最終防衛線となる。
 *
 * 【重要な限界】
 * Vercelなどのサーバーレス環境では、トラフィックに応じて複数のインスタンスが
 * 並行して起動し得る。その場合、インメモリのMutex（方式A）は「同一インスタンス内」
 * でのみ有効であり、インスタンスをまたいだ同時実行は防げない。
 * 本実装は方式Bの「発注確定直前の再読込チェック」を必須の最終防衛線としており、
 * 在庫超過を防ぐための実質的な担保はそちらが担っている。
 *
 * より堅牢にする場合は、Redis／Vercel KVなど外部ストレージによる分散ロック
 * （例: SET key NX PX <ttl> によるロック取得）に置き換えることを推奨する。
 * その場合も、このファイルの `withProductLocks` のインターフェースはそのまま
 * 流用できるよう、実装を差し替えるだけで済む形にしてある。
 */

const productMutexes = new Map<string, Mutex>();

function getMutex(productId: string): Mutex {
  let mutex = productMutexes.get(productId);
  if (!mutex) {
    mutex = new Mutex();
    productMutexes.set(productId, mutex);
  }
  return mutex;
}

/**
 * Acquires locks for all given product IDs (sorted to avoid deadlock when
 * multiple orders overlap on multiple products), runs `fn`, then releases.
 */
export async function withProductLocks<T>(productIds: string[], fn: () => Promise<T>): Promise<T> {
  const uniqueSorted = Array.from(new Set(productIds)).sort();
  const releases: Array<() => void> = [];

  try {
    for (const productId of uniqueSorted) {
      const release = await getMutex(productId).acquire();
      releases.push(release);
    }
    return await fn();
  } finally {
    // Release in reverse acquisition order.
    for (const release of releases.reverse()) {
      release();
    }
  }
}

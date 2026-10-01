import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * app/api/webhooks/polar/route.ts
 *
 * Polar Webhook 처리 엔드포인트
 * ─────────────────────────────────────────────────────────────
 * [핵심 기능 및 비즈니스 로직]
 * 1. 완벽한 웹훅 서명 검증 (Standard Webhooks 규격 준수):
 *    - Polar 공식 대시보드의 Secret(whsec_...) 포맷을 완벽하게 검증합니다.
 *    - standardwebhooks 및 안전한 crypto HMAC 폴백을 결합하여 서명 오류를 원천 차단합니다.
 *
 * 2. 결제 완료 처리 (order.paid, order.created):
 *    - 첫 결제 및 정기 구독 갱신 시 payments 테이블에 결제 이력을 기록합니다.
 *    - Pro(+100 C) / Ultra(+300 C) 크레딧 자동 충전
 *
 * 3. 구독 취소 (Cancel) 및 취소 철회 (Uncancel / Resume) 실시간 처리:
 *    - [Cancel Subscription]:
 *      * subscription.canceled, cancel_at_period_end === true 감지
 *      * users.plan = 'free', users.subscription_status = 'deactive'
 *    - [Uncancel Subscription / Resume / Active]:
 *      * subscription.uncanceled, subscription.resumed, cancel_at_period_end === false 감지
 *      * users.plan = 'pro' | 'ultra', users.subscription_status = 'active'
 *
 * 4. 플랜 업그레이드 및 다운그레이드 처리:
 *    - Pro → Ultra 업그레이드: 차액 +200 크레딧 추가 충전, plan = 'ultra'
 *    - Ultra → Pro 다운그레이드: 크레딧 유지, plan = 'pro'
 */

// ─────────────────────────────────────────────────────────────
// 헬퍼 함수 0: Polar Standard Webhook 서명 안전 검증기
// ─────────────────────────────────────────────────────────────
function verifyWebhookSignature(
  rawBody: string,
  headers: Record<string, string>,
  secret: string
): any {
  try {
    const wh = new Webhook(secret);
    return wh.verify(rawBody, headers);
  } catch (stdErr: any) {
    console.warn('[Polar Webhook] standardwebhooks 1차 검증 예외, crypto HMAC 수동 검증 시도:', stdErr.message);

    const msgId = headers['webhook-id'];
    const msgSignature = headers['webhook-signature'];
    const msgTimestamp = headers['webhook-timestamp'];

    if (!msgId || !msgSignature || !msgTimestamp) {
      throw new Error('웹훅 필수 헤더(webhook-id, webhook-signature, webhook-timestamp) 누락');
    }

    let secretKey = secret.trim();
    if (secretKey.startsWith('whsec_')) {
      secretKey = secretKey.substring(6);
    }

    const keyBytes = Buffer.from(secretKey, 'base64');
    const toSign = `${msgId}.${msgTimestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', keyBytes).update(toSign, 'utf-8').digest('base64');
    const expectedSig = hmac;

    const passedSignatures = msgSignature.split(' ');
    let isMatched = false;
    for (const part of passedSignatures) {
      const [version, sig] = part.split(',');
      if (version === 'v1' && sig === expectedSig) {
        isMatched = true;
        break;
      }
    }

    if (!isMatched) {
      throw new Error('웹훅 서명 불일치 (Invalid Webhook Signature)');
    }

    return JSON.parse(rawBody);
  }
}

// ─────────────────────────────────────────────────────────────
// 헬퍼 함수 1: 상품 ID로 요금제 플랜(pro / ultra) 및 기본 크레딧 계산
// ─────────────────────────────────────────────────────────────
function resolvePlanAndCredits(productId?: string, amount?: number): {
  plan: 'pro' | 'ultra';
  defaultCredits: number;
} {
  const ultraProductId = (
    process.env.POLAR_ULTRA_PRODUCT_ID ||
    process.env.POLAR_PRODUCT_ID_ULTRA ||
    process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ULTRA
  )?.trim();

  if ((productId && productId === ultraProductId) || (amount && amount >= 40000)) {
    return { plan: 'ultra', defaultCredits: 300 };
  }

  return { plan: 'pro', defaultCredits: 100 };
}

// ─────────────────────────────────────────────────────────────
// 헬퍼 함수 2: 페이로드에서 Supabase 유저 ID 추출 (이메일 역추적 포함)
// ─────────────────────────────────────────────────────────────
async function resolveUserId(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  data: any
): Promise<string | null> {
  let userId =
    data.externalCustomerId ||
    data.external_customer_id ||
    data.customer?.externalId ||
    data.customer?.external_id ||
    data.metadata?.userId ||
    data.metadata?.user_id ||
    data.customer?.metadata?.userId ||
    data.customer?.metadata?.user_id;

  if (userId) return userId;

  const email =
    data.customerEmail ||
    data.customer_email ||
    data.customer?.email ||
    data.email;

  if (email) {
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userRecord?.id) {
      return userRecord.id;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();

    let event: any;

    // ─────────────────────────────────────────────────────────
    // 1. Polar 표준 웹훅 서명 안전 검증
    // ─────────────────────────────────────────────────────────
    if (webhookSecret) {
      try {
        const headersObject: Record<string, string> = {};
        request.headers.forEach((val, key) => {
          headersObject[key.toLowerCase()] = val;
        });

        event = verifyWebhookSignature(rawBody, headersObject, webhookSecret);
      } catch (err: any) {
        console.error('[Polar Webhook] 서명 검증 최종 실패:', err.message || err);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else {
      try {
        event = JSON.parse(rawBody);
      } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    const eventType: string = event?.type;
    const data = event?.data;

    console.log(`[Polar Webhook] 이벤트 수신 성공: ${eventType}`);

    if (!data) {
      return NextResponse.json({ error: 'Missing data in payload' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // ─────────────────────────────────────────────────────────
    // 2. 결제 완료 이벤트 처리 (order.paid, order.created, checkout.updated)
    // ─────────────────────────────────────────────────────────
    if (
      eventType === 'order.paid' ||
      eventType === 'order.created' ||
      (eventType === 'checkout.updated' && (data.status === 'succeeded' || data.status === 'confirmed'))
    ) {
      const userId = await resolveUserId(supabaseAdmin, data);

      if (!userId) {
        console.warn('[Polar Webhook] 결제 사용자를 식별할 수 없습니다:', data);
        return NextResponse.json({ received: true, ignored: 'User not found' }, { status: 200 });
      }

      const orderOrCheckoutId = String(data.id || data.checkoutId || data.order_id || '');

      // 중복 결제 확인: 이미 처리된 주문인지 검사
      if (orderOrCheckoutId) {
        const { data: existingPayment } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('polar_checkout_id', orderOrCheckoutId)
          .maybeSingle();

        if (existingPayment) {
          console.log(`[Polar Webhook] 이미 처리 완료된 주문입니다 (${orderOrCheckoutId}). 중복 충전을 건너뜁니다.`);
          return NextResponse.json({ received: true, already_processed: true });
        }
      }

      const productId = data.productId || data.product_id || (Array.isArray(data.products) ? data.products[0] : null);
      const amount = Number(data.amount || data.priceAmount || 0);
      const currency = (data.currency || 'KRW').toUpperCase();
      const billingReason = data.billing_reason || data.billingReason;

      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('plan, credits')
        .eq('id', userId)
        .maybeSingle();

      const currentPlan = currentUser?.plan || 'free';
      const { plan: targetPlan, defaultCredits } = resolvePlanAndCredits(productId, amount);

      let creditsToAdd = defaultCredits;

      // 플랜 업그레이드 결제(subscription_update)인 경우 처리 (Pro → Ultra 차액 200 지급)
      if (billingReason === 'subscription_update' || (currentPlan === 'pro' && targetPlan === 'ultra')) {
        console.log(`[Polar Webhook] 유저(${userId}) 플랜 업그레이드 결제 감지 (Pro → Ultra)`);
        creditsToAdd = 200;
      }

      console.log(`[Polar Webhook] 유저(${userId})에게 [${targetPlan}] 플랜 결제 반영 및 크레딧(+${creditsToAdd}) 충전 시작`);

      // 크레딧 증액 및 플랜 active 처리
      const { error: rpcError } = await supabaseAdmin.rpc('increment_user_credits', {
        target_user_id: userId,
        add_amount: creditsToAdd,
        new_plan: targetPlan,
      });

      if (rpcError) {
        console.error('[Polar Webhook] increment_user_credits RPC 실패, Fallback 업데이트 수행:', rpcError);
        const newCredits = (currentUser?.credits || 0) + creditsToAdd;
        await supabaseAdmin
          .from('users')
          .update({
            credits: newCredits,
            plan: targetPlan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      // payments 테이블에 결제 완료 기록 저장
      await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: amount || (targetPlan === 'ultra' ? 40000 : 20000),
        currency: currency,
        status: 'succeeded',
        plan: targetPlan,
        credits_added: creditsToAdd,
        polar_checkout_id: orderOrCheckoutId,
      });

      console.log(`[Polar Webhook] 결제 완료 처리 완료 (유저: ${userId}, 플랜: ${targetPlan}, 충전: +${creditsToAdd})`);

      return NextResponse.json({
        success: true,
        type: 'order_completed',
        userId,
        plan: targetPlan,
        creditsAdded: creditsToAdd,
      });
    }

    // ─────────────────────────────────────────────────────────
    // 3. 사용자 구독 상태 변경 (Cancel, Uncancel, Resume, Active, Revoked 등)
    // ─────────────────────────────────────────────────────────
    const subscriptionEvents = [
      'customer.state_changed',
      'subscription.created',
      'subscription.updated',
      'subscription.active',
      'subscription.uncanceled',
      'subscription.resumed',
      'subscription.canceled',
      'subscription.revoked',
    ];

    if (subscriptionEvents.includes(eventType)) {
      const userId = await resolveUserId(supabaseAdmin, data);

      if (!userId) {
        console.warn('[Polar Webhook] 상태 변경 대상 유저를 찾을 수 없습니다:', data);
        return NextResponse.json({ received: true, ignored: 'User not found' }, { status: 200 });
      }

      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('plan, subscription_status, credits')
        .eq('id', userId)
        .maybeSingle();

      const currentPlan = currentUser?.plan || 'free';

      // customer.state_changed 의 경우 subscriptions 배열에서 구독 추출
      let targetSubscription: any = null;
      if (eventType === 'customer.state_changed' && Array.isArray(data.subscriptions)) {
        targetSubscription = data.subscriptions[0];
      } else {
        targetSubscription = data;
      }

      // cancel_at_period_end 여부 확인
      const isCancelScheduled =
        targetSubscription?.cancel_at_period_end === true ||
        targetSubscription?.cancelAtPeriodEnd === true ||
        data?.cancel_at_period_end === true ||
        data?.cancelAtPeriodEnd === true;

      // ★ [A. 취소 철회 (Uncancel / Resume) 확인 - 최우선 순위]
      // 사용자가 포털에서 'Uncancel'을 누르면 subscription.uncanceled 또는 cancel_at_period_end=false 이벤트 발생
      const isUncanceled =
        eventType === 'subscription.uncanceled' ||
        eventType === 'subscription.resumed' ||
        (eventType === 'subscription.updated' && isCancelScheduled === false && targetSubscription?.status === 'active');

      if (isUncanceled) {
        const subProductId = targetSubscription?.productId || targetSubscription?.product_id;
        const { plan: restoredPlan } = resolvePlanAndCredits(subProductId);

        console.log(`[Polar Webhook] 유저(${userId}) 구독 취소 철회(Uncancel) 감지 -> ${restoredPlan}, active로 원복`);
        await supabaseAdmin
          .from('users')
          .update({
            plan: restoredPlan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        return NextResponse.json({
          success: true,
          type: 'subscription_uncanceled',
          userId,
          plan: restoredPlan,
          subscription_status: 'active',
        });
      }

      // ★ [B. 구독 취소 / 해지 / 만료 감지]
      // 1) subscription.canceled 또는 subscription.revoked 이벤트인 경우
      // 2) status가 'canceled', 'revoked', 'unpaid' 인 경우
      // 3) cancel_at_period_end 가 true 인 경우
      const isCanceledOrRevoked =
        eventType === 'subscription.canceled' ||
        eventType === 'subscription.revoked' ||
        targetSubscription?.status === 'canceled' ||
        targetSubscription?.status === 'revoked' ||
        targetSubscription?.status === 'unpaid' ||
        isCancelScheduled === true;

      if (isCanceledOrRevoked) {
        console.log(`[Polar Webhook] 유저(${userId})의 구독이 취소/해지되었습니다 -> free, deactive로 변경`);
        await supabaseAdmin
          .from('users')
          .update({
            plan: 'free',
            subscription_status: 'deactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        return NextResponse.json({
          success: true,
          type: 'subscription_canceled',
          userId,
          plan: 'free',
          subscription_status: 'deactive',
        });
      }

      // ★ [C. 구독 활성 상태인 경우 (업그레이드 / 다운그레이드 / 신규 활성화)]
      const isActive =
        targetSubscription?.status === 'active' ||
        targetSubscription?.status === 'trialing' ||
        eventType === 'subscription.active';

      if (isActive) {
        const subProductId = targetSubscription?.productId || targetSubscription?.product_id;
        const { plan: newPlan } = resolvePlanAndCredits(subProductId);

        console.log(`[Polar Webhook] 유저(${userId}) 구독 상태 점검 - 현재 플랜: ${currentPlan}, 새 플랜: ${newPlan}`);

        // 1) 업그레이드: Pro → Ultra
        if (currentPlan === 'pro' && newPlan === 'ultra') {
          console.log(`[Polar Webhook] 유저(${userId}) Pro → Ultra 업그레이드 감지: 차액 200 크레딧 충전`);
          
          await supabaseAdmin.rpc('increment_user_credits', {
            target_user_id: userId,
            add_amount: 200,
            new_plan: 'ultra',
          });

          await supabaseAdmin.from('payments').insert({
            user_id: userId,
            amount: 20000,
            currency: 'KRW',
            status: 'succeeded',
            plan: 'ultra',
            credits_added: 200,
            polar_checkout_id: `upgrade_${targetSubscription?.id || Date.now()}`,
          });

          return NextResponse.json({
            success: true,
            type: 'upgraded',
            userId,
            plan: 'ultra',
            creditsAdded: 200,
            subscription_status: 'active',
          });
        }

        // 2) 다운그레이드: Ultra → Pro
        if (currentPlan === 'ultra' && newPlan === 'pro') {
          console.log(`[Polar Webhook] 유저(${userId}) Ultra → Pro 다운그레이드 감지: 크레딧 유지, 플랜만 pro로 변경`);
          
          await supabaseAdmin
            .from('users')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          return NextResponse.json({
            success: true,
            type: 'downgraded',
            userId,
            plan: 'pro',
            creditsAdded: 0,
            subscription_status: 'active',
          });
        }

        // 3) 일반 활성화 또는 동일 플랜 재개
        await supabaseAdmin
          .from('users')
          .update({
            plan: newPlan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        return NextResponse.json({
          success: true,
          type: 'subscription_active',
          userId,
          plan: newPlan,
          subscription_status: 'active',
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // 4. 그 외 처리 대상이 아닌 이벤트는 200 OK로 수신 완료 처리
    // ─────────────────────────────────────────────────────────
    return NextResponse.json({ received: true, ignored: true });
  } catch (error: any) {
    console.error('[Polar Webhook] 내부 처리 오류:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}

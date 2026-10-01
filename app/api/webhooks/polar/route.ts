import { NextRequest, NextResponse } from 'next/server';
import { validateEvent } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * app/api/webhooks/polar/route.ts
 *
 * Polar Webhook 처리 엔드포인트
 * ─────────────────────────────────────────────────────────────
 * [핵심 기능 및 비즈니스 로직]
 * 1. 결제 완료 처리 (order.paid, order.created):
 *    - 첫 결제 및 정기 구독 갱신 시 payments 테이블에 결제 이력을 기록합니다.
 *    - 사용자의 플랜에 따라 크레딧을 즉시 충전합니다:
 *      * Pro 플랜: +100 크레딧 충전
 *      * Ultra 플랜: +300 크레딧 충전
 *    - 멱등성(중복 결제 방지): 동일 주문 ID가 이미 처리된 경우 크레딧 중복 충전을 방지합니다.
 *
 * 2. 구독 상태 변경 처리 (customer.state_changed, subscription.updated, subscription.revoked 등):
 *    - 첫 구독 시작, 구독 취소, 재개, 만료 시 users 테이블을 갱신합니다:
 *      * 구독 활성화 상태: plan = 'pro' | 'ultra', subscription_status = 'active'
 *      * 구독 만료/해지 상태: plan = 'free', subscription_status = 'deactive'
 *
 * 3. 플랜 업그레이드 및 다운그레이드 처리:
 *    - Pro → Ultra 업그레이드:
 *      * users.plan = 'ultra' 로 수정
 *      * 차액에 해당하는 +200 크레딧 추가 충전
 *      * payments 테이블에 업그레이드 내역 기록
 *    - Ultra → Pro 다운그레이드:
 *      * users.plan = 'pro' 로 수정
 *      * 크레딧은 차감 없이 그대로 유지
 */

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

  // Ultra 상품 ID와 일치하거나 결제 금액이 40,000원 이상인 경우
  if ((productId && productId === ultraProductId) || (amount && amount >= 40000)) {
    return { plan: 'ultra', defaultCredits: 300 };
  }

  // 기본값은 Pro 플랜 (100 크레딧)
  return { plan: 'pro', defaultCredits: 100 };
}

// ─────────────────────────────────────────────────────────────
// 헬퍼 함수 2: 페이로드에서 Supabase 유저 ID 추출 (이메일 역추적 포함)
// ─────────────────────────────────────────────────────────────
async function resolveUserId(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  data: any
): Promise<string | null> {
  // 1) 페이로드 내 externalCustomerId 또는 metadata에서 우선 확인
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

  // 2) 유저 ID가 직접 없을 경우 이메일을 통해 users 테이블 조회
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
    // 1. Polar 웹훅 공식 SDK를 통한 서명 검증 (위조 요청 방지)
    // ─────────────────────────────────────────────────────────
    if (webhookSecret) {
      try {
        const headersObject: Record<string, string> = {};
        request.headers.forEach((val, key) => {
          headersObject[key.toLowerCase()] = val;
        });

        event = validateEvent(rawBody, headersObject, webhookSecret);
      } catch (err: any) {
        console.error('[Polar Webhook] 서명 검증 실패:', err.message || err);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else {
      // 로컬 개발/디버깅 시 시크릿 미설정 시의 대비
      try {
        event = JSON.parse(rawBody);
      } catch (err) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    const eventType: string = event?.type;
    const data = event?.data;

    console.log(`[Polar Webhook] 이벤트 수신: ${eventType}`);

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

      // 고유 결제/주문 식별자 (중복 충전 방지용)
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

      // 상품 정보 및 결제 금액 확인
      const productId = data.productId || data.product_id || (Array.isArray(data.products) ? data.products[0] : null);
      const amount = Number(data.amount || data.priceAmount || 0);
      const currency = (data.currency || 'KRW').toUpperCase();
      const billingReason = data.billing_reason || data.billingReason; // 'subscription_create', 'subscription_cycle', 'subscription_update' 등

      // 유저의 현재 플랜 조회
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('plan, credits')
        .eq('id', userId)
        .maybeSingle();

      const currentPlan = currentUser?.plan || 'free';
      const { plan: targetPlan, defaultCredits } = resolvePlanAndCredits(productId, amount);

      let creditsToAdd = defaultCredits;

      // 플랜 업그레이드 결제(subscription_update)인 경우 처리:
      // 기존 Pro 유저가 Ultra로 업그레이드 결제한 경우 차액인 200 크레딧 지급
      if (billingReason === 'subscription_update' || (currentPlan === 'pro' && targetPlan === 'ultra')) {
        console.log(`[Polar Webhook] 유저(${userId}) 플랜 업그레이드 결제 감지 (Pro → Ultra)`);
        creditsToAdd = 200; // 차액 크레딧 200 지급
      }

      console.log(`[Polar Webhook] 유저(${userId})에게 [${targetPlan}] 플랜 결제 반영 및 크레딧(+${creditsToAdd}) 충전 시작`);

      // 원자적 크레딧 증액 RPC 함수 호출
      const { error: rpcError } = await supabaseAdmin.rpc('increment_user_credits', {
        target_user_id: userId,
        add_amount: creditsToAdd,
        new_plan: targetPlan,
      });

      // 만약 RPC 호출 오류 시 fallback 처리
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

      // payments 결제 기록 테이블에 저장
      const { error: paymentInsertError } = await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: amount || (targetPlan === 'ultra' ? 40000 : 20000),
        currency: currency,
        status: 'succeeded',
        plan: targetPlan,
        credits_added: creditsToAdd,
        polar_checkout_id: orderOrCheckoutId,
      });

      if (paymentInsertError) {
        console.error('[Polar Webhook] payments 테이블 기록 오류:', paymentInsertError);
      }

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
    // 3. 사용자 구독 상태 변경 및 업/다운그레이드 처리
    //    (customer.state_changed, subscription.updated, subscription.revoked, subscription.canceled 등)
    // ─────────────────────────────────────────────────────────
    const subscriptionEvents = [
      'customer.state_changed',
      'subscription.created',
      'subscription.updated',
      'subscription.active',
      'subscription.canceled',
      'subscription.revoked',
    ];

    if (subscriptionEvents.includes(eventType)) {
      const userId = await resolveUserId(supabaseAdmin, data);

      if (!userId) {
        console.warn('[Polar Webhook] 상태 변경 대상 유저를 찾을 수 없습니다:', data);
        return NextResponse.json({ received: true, ignored: 'User not found' }, { status: 200 });
      }

      // 유저의 현재 DB 상태 조회
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('plan, subscription_status, credits')
        .eq('id', userId)
        .maybeSingle();

      const currentPlan = currentUser?.plan || 'free';

      // (A) 구독 해지/만료 여부 확인
      // subscription.revoked 이벤트이거나, 구독이 취소되어 종료된 경우
      const isRevoked =
        eventType === 'subscription.revoked' ||
        data.status === 'revoked' ||
        data.status === 'unpaid';

      // customer.state_changed의 경우 활성 구독 목록 확인
      let activeSubscription: any = null;
      if (eventType === 'customer.state_changed' && Array.isArray(data.subscriptions)) {
        activeSubscription = data.subscriptions.find(
          (sub: any) => sub.status === 'active' || sub.status === 'trialing'
        );
      } else if (data.status === 'active' || data.status === 'trialing') {
        activeSubscription = data;
      }

      // 구독이 만료/해지되었거나 활성 구독이 없는 경우
      if (isRevoked || (!activeSubscription && eventType === 'customer.state_changed')) {
        console.log(`[Polar Webhook] 유저(${userId})의 구독이 만료/해지되었습니다 -> free, deactive로 변경`);
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
          type: 'subscription_deactivated',
          userId,
          plan: 'free',
          subscription_status: 'deactive',
        });
      }

      // (B) 활성 구독이 존재하는 경우 (업그레이드 / 다운그레이드 / 재개 판별)
      if (activeSubscription) {
        const subProductId = activeSubscription.productId || activeSubscription.product_id;
        const { plan: newPlan } = resolvePlanAndCredits(subProductId);

        console.log(`[Polar Webhook] 유저(${userId}) 상태 점검 - 현재 플랜: ${currentPlan}, 새 플랜: ${newPlan}`);

        // 1) 업그레이드: Pro → Ultra
        if (currentPlan === 'pro' && newPlan === 'ultra') {
          console.log(`[Polar Webhook] 유저(${userId}) Pro → Ultra 업그레이드 감지: 차액 200 크레딧 충전`);
          
          // 크레딧 증액 및 플랜 갱신
          await supabaseAdmin.rpc('increment_user_credits', {
            target_user_id: userId,
            add_amount: 200,
            new_plan: 'ultra',
          });

          // payments 테이블에 업그레이드 내역 기록
          await supabaseAdmin.from('payments').insert({
            user_id: userId,
            amount: 20000, // 차액
            currency: 'KRW',
            status: 'succeeded',
            plan: 'ultra',
            credits_added: 200,
            polar_checkout_id: `upgrade_${activeSubscription.id || Date.now()}`,
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
